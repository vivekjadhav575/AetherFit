import type { Severity, SupportedExerciseId } from '@/types/models'
import type { PoseEvaluationInput, PoseEvaluationResult } from '@/features/pose/types'
import { clamp } from '@/lib/utils'

interface PoseFormModelClass {
  id: string
  phase?: string
  centroid: number[]
  score: number
  confidenceBoost?: number
  severity?: Severity
  message?: string
}

interface PoseFormModelExercise {
  featureKeys: string[]
  classes: PoseFormModelClass[]
}

interface PoseFormModelAsset {
  version: number
  name: string
  description: string
  exercises: Partial<Record<SupportedExerciseId, PoseFormModelExercise>>
}

interface PoseFormClassification {
  score: number
  confidence: number
  messages: PoseEvaluationResult['messages']
}

let poseFormModelPromise: Promise<PoseFormModelAsset | null> | null = null
let poseFormModelCache: PoseFormModelAsset | null = null

function buildFeatureVector(featureKeys: string[], metrics: Record<string, number>, confidence: number, holdSeconds?: number) {
  return featureKeys.map((key) => {
    if (key === 'confidence') return confidence
    if (key === 'holdSeconds') return holdSeconds ?? 0
    return metrics[key]
  })
}

function isFiniteFeatureVector(values: number[]) {
  return values.every((value) => Number.isFinite(value))
}

function euclideanDistance(left: number[], right: number[]) {
  return Math.sqrt(left.reduce((total, value, index) => total + (value - right[index]) ** 2, 0))
}

function dedupeMessages(messages: PoseEvaluationResult['messages']) {
  const seen = new Set<string>()
  return messages.filter((message) => {
    if (seen.has(message.code)) return false
    seen.add(message.code)
    return true
  })
}

export async function preloadPoseFormModel() {
  if (poseFormModelCache) return poseFormModelCache
  if (!poseFormModelPromise) {
    poseFormModelPromise = (async () => {
      try {
        const response = await fetch('/models/pose-form-model.v1.json')
        if (!response.ok) {
          throw new Error(`Unable to load pose form model (${response.status})`)
        }
        const parsed = (await response.json()) as PoseFormModelAsset
        poseFormModelCache = parsed
        return parsed
      } catch (error) {
        console.warn('Pose form model unavailable, using rules fallback.', error)
        poseFormModelCache = null
        return null
      }
    })()
  }
  return poseFormModelPromise
}

export function resetPoseFormModel() {
  poseFormModelCache = null
  poseFormModelPromise = null
}

export function setPoseFormModelForTesting(model: PoseFormModelAsset | null) {
  poseFormModelCache = model
  poseFormModelPromise = model ? Promise.resolve(model) : null
}

export function classifyPoseWithModel(
  input: PoseEvaluationInput,
  baseline: PoseEvaluationResult,
) {
  const exerciseModel = poseFormModelCache?.exercises[input.exerciseId]
  if (!exerciseModel) return null

  const vector = buildFeatureVector(exerciseModel.featureKeys, baseline.metrics, baseline.confidence, input.holdSeconds)
  if (!isFiniteFeatureVector(vector)) return null

  const candidates = exerciseModel.classes.filter((item) => !item.phase || item.phase === baseline.phase)
  const matchedCandidates = candidates.length > 0 ? candidates : exerciseModel.classes
  if (matchedCandidates.length === 0) return null

  let bestMatch = matchedCandidates[0]
  let bestDistance = Number.POSITIVE_INFINITY

  for (const item of matchedCandidates) {
    if (item.centroid.length !== vector.length) continue
    const distance = euclideanDistance(vector, item.centroid)
    if (distance < bestDistance) {
      bestDistance = distance
      bestMatch = item
    }
  }

  const normalizedDistance = clamp(bestDistance / Math.max(vector.length, 1), 0, 1)
  const modelConfidence = clamp(1 - normalizedDistance + (bestMatch.confidenceBoost ?? 0), 0.35, 0.99)
  const modelMessages =
    bestMatch.message && bestMatch.severity
      ? [
          {
            code: `model-${input.exerciseId}-${bestMatch.id}`,
            message: bestMatch.message,
            severity: bestMatch.severity,
          },
        ]
      : []

  return {
    score: clamp(Math.round(bestMatch.score), 0, 100),
    confidence: modelConfidence,
    messages: modelMessages,
  } satisfies PoseFormClassification
}

export function blendPoseEvaluations(
  baseline: PoseEvaluationResult,
  classification: PoseFormClassification | null,
) {
  if (!classification) {
    return {
      ...baseline,
      source: 'rules',
    } satisfies PoseEvaluationResult
  }

  const modelLedMessages =
    classification.messages.length > 0 &&
    classification.messages[0]!.severity !== 'info'
      ? classification.messages
      : []

  const mergedMessages = dedupeMessages([...modelLedMessages, ...baseline.messages, ...classification.messages])

  return {
    ...baseline,
    formScore: Math.round((baseline.formScore * 0.45) + (classification.score * 0.55)),
    confidence: clamp((baseline.confidence * 0.7) + (classification.confidence * 0.3), 0, 1),
    messages: mergedMessages,
    source: 'hybrid',
  } satisfies PoseEvaluationResult
}

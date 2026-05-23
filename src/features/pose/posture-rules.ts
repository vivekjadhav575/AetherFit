import type { SupportedExerciseId } from '@/types/models'
import { clamp } from '@/lib/utils'
import { angleBetween, getConfidence, getLandmark, getSideLandmarks, midpoint, POSE_INDEX } from '@/features/pose/landmarks'
import { blendPoseEvaluations, classifyPoseWithModel } from '@/features/pose/form-model'
import type { PoseEvaluationInput, PoseEvaluationResult } from '@/features/pose/types'

function makeResult(partial: Partial<PoseEvaluationResult> = {}): PoseEvaluationResult {
  return {
    phase: partial.phase ?? 'ready',
    formScore: partial.formScore ?? 0,
    confidence: partial.confidence ?? 0,
    repDetected: partial.repDetected ?? false,
    messages: partial.messages ?? [],
    metrics: partial.metrics ?? {},
  }
}

function evaluateSquat(input: PoseEvaluationInput): PoseEvaluationResult {
  const side = getSideLandmarks(input.landmarks)
  if (!side.shoulder || !side.hip || !side.knee || !side.ankle) return makeResult()
  const kneeAngle = angleBetween(side.hip, side.knee, side.ankle)
  const hipAngle = angleBetween(side.shoulder, side.hip, side.knee)
  const leftKnee = getLandmark(input.landmarks, POSE_INDEX.leftKnee)
  const rightKnee = getLandmark(input.landmarks, POSE_INDEX.rightKnee)
  const leftAnkle = getLandmark(input.landmarks, POSE_INDEX.leftAnkle)
  const rightAnkle = getLandmark(input.landmarks, POSE_INDEX.rightAnkle)
  const stanceWidth = leftAnkle && rightAnkle ? Math.abs(leftAnkle.x - rightAnkle.x) : 0.3
  const kneeWidth = leftKnee && rightKnee ? Math.abs(leftKnee.x - rightKnee.x) : stanceWidth
  const phase = kneeAngle < 110 ? 'down' : kneeAngle > 155 ? 'up' : 'transition'
  const messages = []
  let score = 100

  if (kneeAngle > 115 && phase === 'down') {
    messages.push({ code: 'shallow-squat', message: 'Lower a bit more for full depth.', severity: 'warning' as const })
    score -= 18
  }
  if (hipAngle < 45) {
    messages.push({ code: 'forward-lean', message: 'Keep your chest proud and reduce forward lean.', severity: 'warning' as const })
    score -= 14
  }
  if (kneeWidth < stanceWidth * 0.7) {
    messages.push({ code: 'knees-caving', message: 'Keep knees aligned over your toes.', severity: 'critical' as const })
    score -= 22
  }

  return makeResult({
    phase,
    formScore: clamp(score, 40, 100),
    confidence: getConfidence(input.landmarks),
    repDetected: input.previousPhase === 'down' && phase === 'up',
    messages,
    metrics: { kneeAngle, hipAngle, stanceWidth, kneeWidth },
  })
}

function evaluatePushUp(input: PoseEvaluationInput): PoseEvaluationResult {
  const side = getSideLandmarks(input.landmarks)
  if (!side.shoulder || !side.elbow || !side.wrist || !side.hip || !side.ankle) return makeResult()
  const elbowAngle = angleBetween(side.shoulder, side.elbow, side.wrist)
  const torsoAngle = angleBetween(side.shoulder, side.hip, side.ankle)
  const phase = elbowAngle < 92 ? 'down' : elbowAngle > 155 ? 'up' : 'transition'
  const messages = []
  let score = 100

  if (torsoAngle < 158) {
    messages.push({ code: 'hips-sagging', message: 'Brace your core and keep a straight body line.', severity: 'critical' as const })
    score -= 20
  }
  if (elbowAngle > 95 && phase === 'down') {
    messages.push({ code: 'partial-range', message: 'Lower until elbows bend past ninety degrees.', severity: 'warning' as const })
    score -= 16
  }
  if (Math.abs(side.wrist.x - side.elbow.x) > 0.18) {
    messages.push({ code: 'elbow-flare', message: 'Tuck elbows slightly closer to your ribs.', severity: 'warning' as const })
    score -= 14
  }

  return makeResult({
    phase,
    formScore: clamp(score, 35, 100),
    confidence: getConfidence(input.landmarks),
    repDetected: input.previousPhase === 'down' && phase === 'up',
    messages,
    metrics: { elbowAngle, torsoAngle },
  })
}

function evaluateLunge(input: PoseEvaluationInput): PoseEvaluationResult {
  const side = getSideLandmarks(input.landmarks)
  if (!side.shoulder || !side.hip || !side.knee || !side.ankle) return makeResult()
  const kneeAngle = angleBetween(side.hip, side.knee, side.ankle)
  const torsoAngle = angleBetween(side.shoulder, side.hip, side.knee)
  const phase = kneeAngle < 105 ? 'down' : kneeAngle > 155 ? 'up' : 'transition'
  const messages = []
  let score = 100

  if (torsoAngle < 52) {
    messages.push({ code: 'forward-collapse', message: 'Stay tall and stack your ribs over the hips.', severity: 'warning' as const })
    score -= 15
  }
  if (kneeAngle > 115 && phase === 'down') {
    messages.push({ code: 'incomplete-range', message: 'Drop the back knee a little lower.', severity: 'warning' as const })
    score -= 14
  }
  if (Math.abs(side.knee.x - side.ankle.x) > 0.16) {
    messages.push({ code: 'unstable-stance', message: 'Widen your stance slightly for better balance.', severity: 'info' as const })
    score -= 8
  }

  return makeResult({
    phase,
    formScore: clamp(score, 45, 100),
    confidence: getConfidence(input.landmarks),
    repDetected: input.previousPhase === 'down' && phase === 'up',
    messages,
    metrics: { kneeAngle, torsoAngle },
  })
}

function evaluatePlank(input: PoseEvaluationInput): PoseEvaluationResult {
  const side = getSideLandmarks(input.landmarks)
  if (!side.shoulder || !side.elbow || !side.hip || !side.ankle) return makeResult()
  const torsoAngle = angleBetween(side.shoulder, side.hip, side.ankle)
  const shoulderStack = Math.abs(side.shoulder.x - side.elbow.x)
  const messages = []
  let score = 100

  if (torsoAngle < 160) {
    messages.push({ code: 'hips-too-high', message: 'Lower your hips until shoulders and heels line up.', severity: 'warning' as const })
    score -= 18
  }
  if (torsoAngle > 194) {
    messages.push({ code: 'hips-sagging', message: 'Lift slightly through the core to avoid sagging.', severity: 'critical' as const })
    score -= 20
  }
  if (shoulderStack > 0.12) {
    messages.push({ code: 'shoulder-stack', message: 'Bring shoulders directly over elbows.', severity: 'info' as const })
    score -= 8
  }

  const holdReady = clamp((input.holdSeconds ?? 0) / 15, 0, 1)
  return makeResult({
    phase: 'hold',
    formScore: clamp(score, 40, 100),
    confidence: getConfidence(input.landmarks),
    repDetected: holdReady >= 1,
    messages,
    metrics: { torsoAngle, shoulderStack },
  })
}

function evaluateShoulderPress(input: PoseEvaluationInput): PoseEvaluationResult {
  const side = getSideLandmarks(input.landmarks)
  if (!side.shoulder || !side.elbow || !side.wrist || !side.hip) return makeResult()
  const elbowAngle = angleBetween(side.shoulder, side.elbow, side.wrist)
  const trunkAngle = angleBetween(side.shoulder, side.hip, side.knee ?? side.hip)
  const phase = elbowAngle < 95 ? 'down' : elbowAngle > 160 ? 'up' : 'transition'
  const messages = []
  let score = 100

  if (Math.abs(side.wrist.x - side.elbow.x) > 0.13) {
    messages.push({ code: 'press-path', message: 'Keep wrists stacked over elbows.', severity: 'warning' as const })
    score -= 14
  }
  if (trunkAngle < 150) {
    messages.push({ code: 'back-arching', message: 'Keep ribs down and avoid leaning back.', severity: 'critical' as const })
    score -= 18
  }
  if (phase === 'up' && side.wrist.y > side.shoulder.y) {
    messages.push({ code: 'short-lockout', message: 'Finish the press a little higher overhead.', severity: 'info' as const })
    score -= 8
  }

  return makeResult({
    phase,
    formScore: clamp(score, 40, 100),
    confidence: getConfidence(input.landmarks),
    repDetected: input.previousPhase === 'down' && phase === 'up',
    messages,
    metrics: { elbowAngle, trunkAngle },
  })
}

function evaluateBicepCurl(input: PoseEvaluationInput): PoseEvaluationResult {
  const side = getSideLandmarks(input.landmarks)
  if (!side.shoulder || !side.elbow || !side.wrist || !side.hip) return makeResult()
  const elbowAngle = angleBetween(side.shoulder, side.elbow, side.wrist)
  const upperArmTravel = Math.abs(side.elbow.x - side.shoulder.x)
  const phase = elbowAngle < 60 ? 'up' : elbowAngle > 150 ? 'down' : 'transition'
  const messages = []
  let score = 100

  if (upperArmTravel > 0.13) {
    messages.push({ code: 'swinging', message: 'Keep elbows pinned and stop swinging the curl.', severity: 'warning' as const })
    score -= 18
  }
  if (phase === 'up' && side.wrist.y > side.elbow.y) {
    messages.push({ code: 'top-range', message: 'Squeeze a little higher at the top.', severity: 'info' as const })
    score -= 8
  }

  return makeResult({
    phase,
    formScore: clamp(score, 50, 100),
    confidence: getConfidence(input.landmarks),
    repDetected: input.previousPhase === 'up' && phase === 'down',
    messages,
    metrics: { elbowAngle, upperArmTravel },
  })
}

function evaluateJumpingJack(input: PoseEvaluationInput): PoseEvaluationResult {
  const leftWrist = getLandmark(input.landmarks, POSE_INDEX.leftWrist)
  const rightWrist = getLandmark(input.landmarks, POSE_INDEX.rightWrist)
  const leftAnkle = getLandmark(input.landmarks, POSE_INDEX.leftAnkle)
  const rightAnkle = getLandmark(input.landmarks, POSE_INDEX.rightAnkle)
  const hips = midpoint(getLandmark(input.landmarks, POSE_INDEX.leftHip), getLandmark(input.landmarks, POSE_INDEX.rightHip))
  if (!leftWrist || !rightWrist || !leftAnkle || !rightAnkle) return makeResult()
  const armsOpen = leftWrist.y < hips.y && rightWrist.y < hips.y
  const feetOpen = Math.abs(leftAnkle.x - rightAnkle.x) > 0.45
  const phase = armsOpen && feetOpen ? 'open' : 'closed'
  const messages = []
  let score = 100

  if (phase === 'open' && !feetOpen) {
    messages.push({ code: 'stance-width', message: 'Open your feet a little wider.', severity: 'info' as const })
    score -= 10
  }
  if (phase === 'open' && !armsOpen) {
    messages.push({ code: 'arm-reach', message: 'Reach arms fully overhead.', severity: 'warning' as const })
    score -= 14
  }

  return makeResult({
    phase,
    formScore: clamp(score, 55, 100),
    confidence: getConfidence(input.landmarks),
    repDetected: input.previousPhase === 'open' && phase === 'closed',
    messages,
    metrics: { feetWidth: Math.abs(leftAnkle.x - rightAnkle.x) },
  })
}

function evaluateCatCow(input: PoseEvaluationInput): PoseEvaluationResult {
  const shoulderMid = midpoint(getLandmark(input.landmarks, POSE_INDEX.leftShoulder), getLandmark(input.landmarks, POSE_INDEX.rightShoulder))
  const hipMid = midpoint(getLandmark(input.landmarks, POSE_INDEX.leftHip), getLandmark(input.landmarks, POSE_INDEX.rightHip))
  const nose = getLandmark(input.landmarks, POSE_INDEX.nose)
  if (!shoulderMid || !hipMid || !nose) return makeResult()
  const spinalCurve = nose.y - shoulderMid.y
  const phase = spinalCurve < -0.03 ? 'cow' : spinalCurve > 0.02 ? 'cat' : 'transition'
  const messages = []
  let score = 100

  if (Math.abs(spinalCurve) < 0.015) {
    messages.push({ code: 'small-range', message: 'Move through a bigger spinal wave with your breath.', severity: 'info' as const })
    score -= 10
  }

  return makeResult({
    phase,
    formScore: clamp(score, 60, 100),
    confidence: getConfidence(input.landmarks),
    repDetected: input.previousPhase === 'cow' && phase === 'cat',
    messages,
    metrics: { spinalCurve, shoulderHeight: shoulderMid.y, hipHeight: hipMid.y },
  })
}

function evaluateHipHinge(input: PoseEvaluationInput): PoseEvaluationResult {
  const side = getSideLandmarks(input.landmarks)
  if (!side.shoulder || !side.hip || !side.knee) return makeResult()
  const hipAngle = angleBetween(side.shoulder, side.hip, side.knee)
  const kneeTravel = Math.abs(side.knee.x - side.ankle!.x)
  const phase = hipAngle < 95 ? 'down' : hipAngle > 145 ? 'up' : 'transition'
  const messages = []
  let score = 100

  if (kneeTravel > 0.14) {
    messages.push({ code: 'too-much-knee-bend', message: 'Send the hips back instead of driving knees forward.', severity: 'warning' as const })
    score -= 14
  }
  if (hipAngle > 100 && phase === 'down') {
    messages.push({ code: 'shallow-hinge', message: 'Push hips farther back to load the posterior chain.', severity: 'info' as const })
    score -= 10
  }

  return makeResult({
    phase,
    formScore: clamp(score, 50, 100),
    confidence: getConfidence(input.landmarks),
    repDetected: input.previousPhase === 'down' && phase === 'up',
    messages,
    metrics: { hipAngle, kneeTravel },
  })
}

const evaluators: Record<SupportedExerciseId, (input: PoseEvaluationInput) => PoseEvaluationResult> = {
  squat: evaluateSquat,
  'push-up': evaluatePushUp,
  lunge: evaluateLunge,
  plank: evaluatePlank,
  'shoulder-press': evaluateShoulderPress,
  'bicep-curl': evaluateBicepCurl,
  'jumping-jack': evaluateJumpingJack,
  'cat-cow': evaluateCatCow,
  'hip-hinge': evaluateHipHinge,
}

export function evaluateExercisePoseWithRules(input: PoseEvaluationInput) {
  return evaluators[input.exerciseId](input)
}

export function evaluateExercisePose(input: PoseEvaluationInput) {
  const baseline = evaluateExercisePoseWithRules(input)
  const modelClassification = classifyPoseWithModel(input, baseline)
  return blendPoseEvaluations(baseline, modelClassification)
}

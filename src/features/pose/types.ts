import type { Severity, SupportedExerciseId } from '@/types/models'

export interface NormalizedLandmark {
  x: number
  y: number
  z: number
  visibility?: number
}

export interface PoseFeedbackMessage {
  code: string
  message: string
  severity: Severity
}

export interface PoseEvaluationInput {
  exerciseId: SupportedExerciseId
  landmarks: NormalizedLandmark[]
  previousPhase?: string
  holdSeconds?: number
}

export interface PoseEvaluationResult {
  phase: string
  formScore: number
  confidence: number
  repDetected: boolean
  messages: PoseFeedbackMessage[]
  metrics: Record<string, number>
  source?: 'rules' | 'model' | 'hybrid'
}

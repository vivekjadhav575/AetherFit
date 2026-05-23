import { describe, expect, it } from 'vitest'

import { blendPoseEvaluations, classifyPoseWithModel, setPoseFormModelForTesting } from '@/features/pose/form-model'
import { evaluateExercisePoseWithRules } from '@/features/pose/posture-rules'
import type { NormalizedLandmark } from '@/features/pose/types'

function makeLandmarks(): NormalizedLandmark[] {
  return Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.99 }))
}

describe('pose form model', () => {
  it('falls back to rules when model is unavailable', () => {
    setPoseFormModelForTesting(null)
    const landmarks = makeLandmarks()
    const baseline = evaluateExercisePoseWithRules({ exerciseId: 'push-up', landmarks, previousPhase: 'down' })
    const blended = blendPoseEvaluations(baseline, null)

    expect(blended.source).toBe('rules')
    expect(blended.formScore).toBe(baseline.formScore)
  })

  it('classifies and blends a model-backed squat correction', () => {
    setPoseFormModelForTesting({
      version: 1,
      name: 'test-model',
      description: 'test',
      exercises: {
        squat: {
          featureKeys: ['kneeAngle', 'hipAngle', 'stanceWidth', 'kneeWidth', 'confidence'],
          classes: [
            {
              id: 'knees-caving',
              centroid: [104, 72, 0.3, 0.16, 0.95],
              score: 55,
              severity: 'critical',
              message: 'Model says knees are collapsing inward.',
            },
          ],
        },
      },
    })

    const landmarks = makeLandmarks()
    landmarks[12] = { x: 0.54, y: 0.3, z: 0, visibility: 0.99 }
    landmarks[24] = { x: 0.54, y: 0.5, z: 0, visibility: 0.99 }
    landmarks[26] = { x: 0.6, y: 0.64, z: 0, visibility: 0.99 }
    landmarks[28] = { x: 0.66, y: 0.82, z: 0, visibility: 0.99 }
    landmarks[25] = { x: 0.42, y: 0.64, z: 0, visibility: 0.99 }
    landmarks[27] = { x: 0.34, y: 0.82, z: 0, visibility: 0.99 }

    const baseline = evaluateExercisePoseWithRules({ exerciseId: 'squat', landmarks, previousPhase: 'down' })
    const classification = classifyPoseWithModel({ exerciseId: 'squat', landmarks, previousPhase: 'down' }, baseline)
    const blended = blendPoseEvaluations(baseline, classification)

    expect(classification).not.toBeNull()
    expect(blended.source).toBe('hybrid')
    expect(blended.messages[0]?.message).toContain('Model says')
    expect(blended.formScore).toBeLessThan(baseline.formScore)
  })
})

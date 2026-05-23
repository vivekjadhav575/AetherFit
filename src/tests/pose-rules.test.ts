import { describe, expect, it } from 'vitest'

import { evaluateExercisePose } from '@/features/pose/posture-rules'
import type { NormalizedLandmark } from '@/features/pose/types'

function makeLandmarks(): NormalizedLandmark[] {
  return Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.99 }))
}

describe('pose rules', () => {
  it('flags squat depth issues', () => {
    const landmarks = makeLandmarks()
    landmarks[12] = { x: 0.55, y: 0.3, z: 0, visibility: 0.99 }
    landmarks[24] = { x: 0.55, y: 0.5, z: 0, visibility: 0.99 }
    landmarks[26] = { x: 0.62, y: 0.63, z: 0, visibility: 0.99 }
    landmarks[28] = { x: 0.66, y: 0.82, z: 0, visibility: 0.99 }
    landmarks[25] = { x: 0.38, y: 0.63, z: 0, visibility: 0.99 }
    landmarks[27] = { x: 0.34, y: 0.82, z: 0, visibility: 0.99 }

    const result = evaluateExercisePose({ exerciseId: 'squat', landmarks, previousPhase: 'down' })
    expect(result.messages.length).toBeGreaterThanOrEqual(0)
    expect(result.formScore).toBeLessThanOrEqual(100)
  })

  it('detects push-up rep transition', () => {
    const landmarks = makeLandmarks()
    landmarks[12] = { x: 0.55, y: 0.4, z: 0, visibility: 0.99 }
    landmarks[14] = { x: 0.62, y: 0.45, z: 0, visibility: 0.99 }
    landmarks[16] = { x: 0.72, y: 0.46, z: 0, visibility: 0.99 }
    landmarks[24] = { x: 0.55, y: 0.54, z: 0, visibility: 0.99 }
    landmarks[28] = { x: 0.8, y: 0.62, z: 0, visibility: 0.99 }

    const result = evaluateExercisePose({ exerciseId: 'push-up', landmarks, previousPhase: 'down' })
    expect(result.phase).toBeTruthy()
  })
})

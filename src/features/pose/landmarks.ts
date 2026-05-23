import type { NormalizedLandmark } from '@/features/pose/types'
import { average, clamp } from '@/lib/utils'

export const POSE_INDEX = {
  nose: 0,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
} as const

export function getLandmark(landmarks: NormalizedLandmark[], index: number) {
  return landmarks[index]
}

export function midpoint(first: NormalizedLandmark, second: NormalizedLandmark) {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
    z: (first.z + second.z) / 2,
    visibility: average([first.visibility ?? 0, second.visibility ?? 0]),
  }
}

export function distance(first: NormalizedLandmark, second: NormalizedLandmark) {
  return Math.hypot(first.x - second.x, first.y - second.y, first.z - second.z)
}

export function angleBetween(a: NormalizedLandmark, b: NormalizedLandmark, c: NormalizedLandmark) {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)
  const degrees = Math.abs((radians * 180) / Math.PI)
  return degrees > 180 ? 360 - degrees : degrees
}

export function getSideLandmarks(landmarks: NormalizedLandmark[]) {
  const leftVisibility = average([
    landmarks[POSE_INDEX.leftShoulder]?.visibility ?? 0,
    landmarks[POSE_INDEX.leftHip]?.visibility ?? 0,
    landmarks[POSE_INDEX.leftKnee]?.visibility ?? 0,
  ])
  const rightVisibility = average([
    landmarks[POSE_INDEX.rightShoulder]?.visibility ?? 0,
    landmarks[POSE_INDEX.rightHip]?.visibility ?? 0,
    landmarks[POSE_INDEX.rightKnee]?.visibility ?? 0,
  ])

  const side = leftVisibility >= rightVisibility ? 'left' : 'right'

  return side === 'left'
    ? {
        side,
        shoulder: landmarks[POSE_INDEX.leftShoulder],
        elbow: landmarks[POSE_INDEX.leftElbow],
        wrist: landmarks[POSE_INDEX.leftWrist],
        hip: landmarks[POSE_INDEX.leftHip],
        knee: landmarks[POSE_INDEX.leftKnee],
        ankle: landmarks[POSE_INDEX.leftAnkle],
      }
    : {
        side,
        shoulder: landmarks[POSE_INDEX.rightShoulder],
        elbow: landmarks[POSE_INDEX.rightElbow],
        wrist: landmarks[POSE_INDEX.rightWrist],
        hip: landmarks[POSE_INDEX.rightHip],
        knee: landmarks[POSE_INDEX.rightKnee],
        ankle: landmarks[POSE_INDEX.rightAnkle],
      }
}

export function getConfidence(landmarks: NormalizedLandmark[]) {
  return clamp(
    average(
      [
        POSE_INDEX.leftShoulder,
        POSE_INDEX.rightShoulder,
        POSE_INDEX.leftHip,
        POSE_INDEX.rightHip,
        POSE_INDEX.leftKnee,
        POSE_INDEX.rightKnee,
        POSE_INDEX.leftAnkle,
        POSE_INDEX.rightAnkle,
      ].map((index) => landmarks[index]?.visibility ?? 0),
    ),
    0,
    1,
  )
}

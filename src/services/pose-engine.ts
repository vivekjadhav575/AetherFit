import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'

let poseLandmarkerPromise: Promise<PoseLandmarker> | null = null
const mediapipeVersion = '0.10.35'

export async function getPoseLandmarker() {
  if (!poseLandmarkerPromise) {
    poseLandmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${mediapipeVersion}/wasm`)
      return PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
        },
        numPoses: 1,
        runningMode: 'VIDEO',
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.45,
        outputSegmentationMasks: false,
      })
    })()
  }
  return poseLandmarkerPromise
}

export function resetPoseLandmarker() {
  poseLandmarkerPromise = null
}

import { PoseLandmarker } from '@mediapipe/tasks-vision'

import type { NormalizedLandmark } from '@/features/pose/types'

export function drawPoseOverlay(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  landmarks: NormalizedLandmark[] | undefined,
  mirrored: boolean,
  emphasis: 'good' | 'warning' | 'critical',
) {
  const context = canvas.getContext('2d')
  if (!context) return
  canvas.width = video.videoWidth || 1280
  canvas.height = video.videoHeight || 720
  context.clearRect(0, 0, canvas.width, canvas.height)
  if (!landmarks) return

  context.save()
  if (mirrored) {
    context.translate(canvas.width, 0)
    context.scale(-1, 1)
  }

  const strokeStyle = emphasis === 'critical' ? '#ef4444' : emphasis === 'warning' ? '#f59e0b' : '#22c55e'
  context.lineWidth = 4
  context.strokeStyle = strokeStyle
  context.fillStyle = strokeStyle
  context.globalAlpha = 0.9

  for (const connection of PoseLandmarker.POSE_CONNECTIONS) {
    const start = landmarks[connection.start]
    const end = landmarks[connection.end]
    if (!start || !end) continue
    context.beginPath()
    context.moveTo(start.x * canvas.width, start.y * canvas.height)
    context.lineTo(end.x * canvas.width, end.y * canvas.height)
    context.stroke()
  }

  for (const landmark of landmarks) {
    context.beginPath()
    context.arc(landmark.x * canvas.width, landmark.y * canvas.height, 5, 0, Math.PI * 2)
    context.fill()
  }

  context.restore()
}

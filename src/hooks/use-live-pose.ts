import { useEffect, useRef, useState } from 'react'

import { evaluateExercisePose } from '@/features/pose/posture-rules'
import { drawPoseOverlay } from '@/features/pose/pose-canvas'
import type { NormalizedLandmark, PoseFeedbackMessage } from '@/features/pose/types'
import { preloadPoseFormModel } from '@/features/pose/form-model'
import { getPoseLandmarker } from '@/services/pose-engine'
import { SpeechCoach } from '@/services/speech-coach'
import type { AppSettings, FormEvent, RepEvent, SupportedExerciseId } from '@/types/models'
import { createId } from '@/lib/utils'

type CameraState = 'idle' | 'requesting' | 'ready' | 'error'

function estimateLighting(video: HTMLVideoElement) {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const context = canvas.getContext('2d')
  if (!context) return 0.5
  context.drawImage(video, 0, 0, canvas.width, canvas.height)
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
  let total = 0
  for (let index = 0; index < pixels.length; index += 4) {
    total += (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3
  }
  return total / (pixels.length / 4) / 255
}

function isSecureCameraContext() {
  if (window.isSecureContext) return true
  return ['localhost', '127.0.0.1'].includes(window.location.hostname)
}

function formatCameraError(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') {
      return 'Camera permission was blocked. Allow camera access in the browser, then try again.'
    }
    if (error.name === 'NotFoundError') {
      return 'No camera was found on this device.'
    }
    if (error.name === 'NotReadableError') {
      return 'Camera is already in use by another app or browser tab.'
    }
    if (error.name === 'OverconstrainedError') {
      return 'Requested camera resolution is not available on this device.'
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unable to access the camera.'
}

export function useLivePose(settings: AppSettings, exerciseId: SupportedExerciseId) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef<number | null>(null)
  const previousPhaseRef = useRef('ready')
  const lastFeedbackCodeRef = useRef('')
  const holdStartRef = useRef<number | null>(null)
  const repEventsRef = useRef<RepEvent[]>([])
  const formEventsRef = useRef<FormEvent[]>([])
  const lastLightingCheckRef = useRef(0)

  const [cameraState, setCameraState] = useState<CameraState>('idle')
  const [cameraError, setCameraError] = useState<string>()
  const [running, setRunning] = useState(false)
  const [repCount, setRepCount] = useState(0)
  const [formScore, setFormScore] = useState(0)
  const [confidence, setConfidence] = useState(0)
  const [messages, setMessages] = useState<PoseFeedbackMessage[]>([])
  const [phase, setPhase] = useState('ready')
  const [evaluationSource, setEvaluationSource] = useState<'rules' | 'model' | 'hybrid'>('rules')
  const [inferenceLag, setInferenceLag] = useState(0)
  const [lightingScore, setLightingScore] = useState(0.75)
  const [landmarks, setLandmarks] = useState<NormalizedLandmark[]>()

  function stopCamera() {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setRunning(false)
    setCameraState('idle')
  }

  useEffect(() => {
    if (!running) return

    let cancelled = false

    const processFrame = async () => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || video.readyState < 2 || cancelled) {
        frameRef.current = requestAnimationFrame(() => {
          void processFrame()
        })
        return
      }

      const start = performance.now()
      try {
        const landmarker = await getPoseLandmarker()
        const result = landmarker.detectForVideo(video, performance.now())
        const detected = result.landmarks?.[0] as NormalizedLandmark[] | undefined
        const holdSeconds =
          exerciseId === 'plank' && detected
            ? holdStartRef.current
              ? (Date.now() - holdStartRef.current) / 1000
              : 0
            : 0

        const evaluation = detected
          ? evaluateExercisePose({
              exerciseId,
              landmarks: detected,
              previousPhase: previousPhaseRef.current,
              holdSeconds,
            })
          : null

        if (detected) {
          setLandmarks(detected)
          const emphasis = evaluation?.messages.some((item) => item.severity === 'critical')
            ? 'critical'
            : evaluation?.messages.some((item) => item.severity === 'warning')
              ? 'warning'
              : 'good'
          drawPoseOverlay(canvas, video, detected, settings.cameraMirrored, emphasis)
        } else {
          drawPoseOverlay(canvas, video, undefined, settings.cameraMirrored, 'warning')
        }

        if (evaluation) {
          setPhase(evaluation.phase)
          setFormScore(evaluation.formScore)
          setConfidence(evaluation.confidence)
          setMessages(evaluation.messages)
          setEvaluationSource(evaluation.source ?? 'rules')
          previousPhaseRef.current = evaluation.phase

          if (exerciseId === 'plank') {
            if (evaluation.messages.length === 0 && evaluation.confidence > 0.55) {
              holdStartRef.current ??= Date.now()
            } else {
              holdStartRef.current = null
            }
          }

          const primaryMessage = evaluation.messages[0]
          if (primaryMessage && primaryMessage.code !== lastFeedbackCodeRef.current) {
            lastFeedbackCodeRef.current = primaryMessage.code
            const event: FormEvent = {
              id: createId('form'),
              timestamp: new Date().toISOString(),
              exerciseId,
              code: primaryMessage.code,
              message: primaryMessage.message,
              severity: primaryMessage.severity,
              scoreImpact: 100 - evaluation.formScore,
            }
            formEventsRef.current = [...formEventsRef.current, event]
            SpeechCoach.speak(primaryMessage.message, primaryMessage.severity, {
              enabled: settings.speech.enabled,
              rate: settings.speech.rate,
              pitch: settings.speech.pitch,
              minIntervalMs: settings.speech.minIntervalMs,
              selectedVoice: settings.selectedVoice,
            })
          }

          if (evaluation.repDetected && evaluation.confidence > 0.45) {
            const repNumber = repEventsRef.current.length + 1
            const repEvent: RepEvent = {
              id: createId('rep'),
              exerciseId,
              repNumber,
              timestamp: new Date().toISOString(),
              phase: evaluation.phase as RepEvent['phase'],
              score: evaluation.formScore,
            }
            repEventsRef.current = [...repEventsRef.current, repEvent]
            setRepCount(repNumber)
            if (evaluation.formScore >= 88) {
              SpeechCoach.speak('Good rep', 'info', {
                enabled: settings.speech.enabled,
                rate: settings.speech.rate,
                pitch: settings.speech.pitch,
                minIntervalMs: settings.speech.minIntervalMs,
                selectedVoice: settings.selectedVoice,
              })
            }
            if (exerciseId === 'plank') {
              holdStartRef.current = Date.now()
            }
          }
        }

        if (performance.now() - lastLightingCheckRef.current > 1200) {
          setLightingScore(estimateLighting(video))
          lastLightingCheckRef.current = performance.now()
        }

        setInferenceLag(Math.round(performance.now() - start))
      } catch (error) {
        setCameraState('error')
        setCameraError(error instanceof Error ? `Pose engine failed: ${error.message}` : 'Pose engine failed to process the camera feed.')
        setRunning(false)
      }

      frameRef.current = requestAnimationFrame(() => {
        void processFrame()
      })
    }

    frameRef.current = requestAnimationFrame(() => {
      void processFrame()
    })

    return () => {
      cancelled = true
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [exerciseId, running, settings.cameraMirrored, settings.selectedVoice, settings.speech.enabled, settings.speech.minIntervalMs, settings.speech.pitch, settings.speech.rate])

  useEffect(() => stopCamera, [])

  async function startCamera() {
    if (!isSecureCameraContext()) {
      setCameraState('error')
      setCameraError('Camera requires HTTPS or localhost. Open the app on localhost during development or deploy over HTTPS.')
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('error')
      setCameraError('This browser does not support camera access through getUserMedia.')
      return
    }

    let stream: MediaStream | null = null

    try {
      setCameraState('requesting')
      setCameraError(undefined)
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      await Promise.allSettled([getPoseLandmarker(), preloadPoseFormModel()])
      setCameraState('ready')
    } catch (error) {
      stream?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setCameraState('error')
      setCameraError(formatCameraError(error))
    }
  }

  function startSession() {
    if (cameraState !== 'ready') return
    repEventsRef.current = []
    formEventsRef.current = []
    previousPhaseRef.current = 'ready'
    holdStartRef.current = null
    lastFeedbackCodeRef.current = ''
    setRepCount(0)
    setFormScore(0)
    setConfidence(0)
    setMessages([])
    setPhase('ready')
    setEvaluationSource('rules')
    setRunning(true)
  }

  function stopSession() {
    setRunning(false)
    return {
      repEvents: repEventsRef.current,
      formEvents: formEventsRef.current,
      repCount,
    }
  }

  function captureCalibration() {
    if (!landmarks) return null
    return {
      baselineShoulderWidth: Math.abs((landmarks[11]?.x ?? 0) - (landmarks[12]?.x ?? 0)),
      baselineHipWidth: Math.abs((landmarks[23]?.x ?? 0) - (landmarks[24]?.x ?? 0)),
      framingScore: confidence,
      completedAt: new Date().toISOString(),
    }
  }

  return {
    videoRef,
    canvasRef,
    cameraState,
    cameraError,
    startCamera,
    stopCamera,
    running,
    startSession,
    stopSession,
    repCount,
    formScore,
    confidence,
    messages,
    phase,
    evaluationSource,
    inferenceLag,
    lightingScore,
    captureCalibration,
    repEvents: repEventsRef,
    formEvents: formEventsRef,
  }
}

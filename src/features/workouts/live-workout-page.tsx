import { AlertTriangle, Camera, CheckCircle2, Mic2, Play, RotateCcw, Square, Trophy } from 'lucide-react'
import { useEffect, useEffectEvent, useState } from 'react'
import { toast } from 'sonner'

import { SectionHeader } from '@/components/shared/section-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLivePose } from '@/hooks/use-live-pose'
import { completeSessionDraft } from '@/features/workouts/workout-scoring'
import { useAppStore } from '@/store/app-store'
import type { SupportedExerciseId, WorkoutSession } from '@/types/models'
import { createId } from '@/lib/utils'

const supportedExercises: SupportedExerciseId[] = ['squat', 'push-up', 'lunge', 'plank', 'shoulder-press', 'bicep-curl', 'jumping-jack', 'cat-cow', 'hip-hinge']

export function LiveWorkoutPage() {
  const snapshot = useAppStore((state) => state.snapshot)
  const recordSession = useAppStore((state) => state.recordSession)
  const setCalibration = useAppStore((state) => state.setCalibration)
  const settings = snapshot.settings
  const [exerciseId, setExerciseId] = useState<SupportedExerciseId>('squat')
  const [summarySession, setSummarySession] = useState<WorkoutSession | null>(null)
  const [sessionStart, setSessionStart] = useState<number | null>(null)
  const {
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
    repEvents,
    formEvents,
  } = useLivePose(settings, exerciseId)

  const stopCameraOnUnmount = useEffectEvent(() => {
    stopCamera()
  })

  useEffect(() => {
    return () => {
      stopCameraOnUnmount()
    }
  }, [])

  const selectedExercise = snapshot.exercises.find((exercise) => exercise.id === exerciseId)

  async function finishWorkout() {
    if (!sessionStart) return
    stopSession()
    const durationSeconds = Math.max(1, Math.round((Date.now() - sessionStart) / 1000))
    const draft: WorkoutSession = {
      id: createId('session'),
      exerciseId,
      startedAt: new Date(sessionStart).toISOString(),
      durationSeconds,
      repsCompleted: repEvents.current.length,
      caloriesBurned: 0,
      averageFormScore: formScore,
      accuracyTrend: [],
      repEvents: repEvents.current,
      formEvents: formEvents.current,
      recommendations: [],
      xpGained: 0,
      updatedAt: new Date().toISOString(),
    }
    const completed = completeSessionDraft(draft, selectedExercise, repEvents.current, formEvents.current, durationSeconds)
    const previousBadgeIds = snapshot.badges.filter((badge) => badge.unlocked).map((badge) => badge.id)
    await recordSession(completed)
    const latestSnapshot = useAppStore.getState().snapshot
    const newBadges = latestSnapshot.badges.filter((badge) => badge.unlocked && !previousBadgeIds.includes(badge.id))
    if (newBadges.length > 0) {
      toast.success('New badges unlocked', {
        description: newBadges.map((badge) => badge.name).join(', '),
      })
    }
    setSummarySession(completed)
    setSessionStart(null)
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Live coach"
        title="Real-time posture correction"
        description="Use MediaPipe-powered pose tracking, text guidance, and voice cues to improve form and rep quality in real time."
        action={
          <div className="flex gap-3">
            <Button onClick={() => void startCamera()} disabled={cameraState === 'requesting'}>
              <Camera className="h-4 w-4" />
              {cameraState === 'ready' ? 'Camera ready' : 'Enable camera'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                const calibration = captureCalibration()
                if (!calibration) {
                  toast.error('Stand in frame first, then run calibration.')
                  return
                }
                void setCalibration(calibration)
                toast.success('Calibration saved', {
                  description: 'Neutral stance and framing score captured for live feedback.',
                })
              }}
            >
              Calibrate stance
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <div>
              <CardTitle>Camera and movement overlay</CardTitle>
              <CardDescription>Raw video is not stored by default. Landmark analysis runs locally in the browser.</CardDescription>
            </div>
            <Badge variant={cameraState === 'ready' ? 'success' : cameraState === 'error' ? 'danger' : 'secondary'}>{cameraState}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[28px] bg-slate-950 p-3 shadow-inset">
              <div className="relative aspect-video overflow-hidden rounded-[22px] bg-slate-900">
                <video ref={videoRef} autoPlay muted playsInline className={`h-full w-full object-cover ${settings.cameraMirrored ? 'scale-x-[-1]' : ''}`} />
                <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
                {cameraState !== 'ready' ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/75 text-sm text-white">
                    {cameraError ?? 'Enable camera access to start live coaching.'}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl bg-background/70 p-4 shadow-inset">
                <p className="text-sm text-muted-foreground">Reps</p>
                <p className="text-2xl font-semibold">{repCount}</p>
              </div>
              <div className="rounded-2xl bg-background/70 p-4 shadow-inset">
                <p className="text-sm text-muted-foreground">Form score</p>
                <p className="text-2xl font-semibold">{formScore}%</p>
              </div>
              <div className="rounded-2xl bg-background/70 p-4 shadow-inset">
                <p className="text-sm text-muted-foreground">Confidence</p>
                <p className="text-2xl font-semibold">{Math.round(confidence * 100)}%</p>
              </div>
              <div className="rounded-2xl bg-background/70 p-4 shadow-inset">
                <p className="text-sm text-muted-foreground">Inference lag</p>
                <p className="text-2xl font-semibold">{inferenceLag} ms</p>
              </div>
            </div>

            <div className="rounded-2xl bg-background/70 p-4 text-sm text-muted-foreground shadow-inset">
              Camera works only on `localhost` during development or over `https` after deployment. If it still fails, check browser permission and close other apps using the webcam.
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {!running ? (
                <Button
                  className="flex-1"
                  disabled={cameraState !== 'ready'}
                  onClick={() => {
                    startSession()
                    setSessionStart(Date.now())
                  }}
                >
                  <Play className="h-4 w-4" />
                  Start coached workout
                </Button>
              ) : (
                <Button className="flex-1" variant="danger" onClick={() => void finishWorkout()}>
                  <Square className="h-4 w-4" />
                  End workout
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => {
                  stopCamera()
                  void startCamera()
                }}
              >
                <RotateCcw className="h-4 w-4" />
                Restart camera
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Session setup</CardTitle>
                <CardDescription>Select a supported movement for live phase detection and rep counting.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-semibold">Exercise</p>
                <Select value={exerciseId} onValueChange={(value) => setExerciseId(value as SupportedExerciseId)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedExercises.map((item) => (
                      <SelectItem key={item} value={item}>
                        {snapshot.exercises.find((exercise) => exercise.id === item)?.name ?? item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedExercise ? (
                <div className="rounded-2xl bg-background/70 p-4 shadow-inset">
                  <p className="font-semibold">{selectedExercise.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedExercise.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedExercise.targetMuscles.map((muscle) => (
                      <Badge key={muscle} variant="secondary">
                        {muscle}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="rounded-2xl bg-background/70 p-4 shadow-inset">
                <p className="font-semibold">Audio coaching</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {settings.speech.enabled ? 'Voice cues are enabled and will only speak on state changes or critical issues.' : 'Voice cues are disabled in settings.'}
                </p>
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <Mic2 className="h-4 w-4 text-primary" />
                  <span>{settings.selectedVoice ?? 'System default voice'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Live feedback</CardTitle>
                <CardDescription>Short, actionable prompts based on joint angles, range of motion, and movement phase.</CardDescription>
              </div>
              <Badge variant={messages[0]?.severity === 'critical' ? 'danger' : messages[0]?.severity === 'warning' ? 'warning' : 'success'}>
                {phase}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>Form accuracy</span>
                    <span>{formScore}%</span>
                  </div>
                  <Progress value={formScore} />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>Tracking confidence</span>
                    <span>{Math.round(confidence * 100)}%</span>
                  </div>
                  <Progress value={confidence * 100} />
                </div>
              </div>

              <div className="rounded-2xl bg-background/70 p-4 text-sm text-muted-foreground shadow-inset">
                Form scoring source: {evaluationSource === 'hybrid' ? 'Hybrid model + safety rules' : 'Safety rules fallback'}
              </div>

              <div className="space-y-3 rounded-[24px] bg-background/70 p-4 shadow-inset">
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <div key={message.code} className="flex items-start gap-3 rounded-2xl bg-card/70 p-3">
                      {message.severity === 'critical' ? (
                        <AlertTriangle className="mt-0.5 h-4 w-4 text-danger" />
                      ) : (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                      )}
                      <div>
                        <p className="font-medium">{message.message}</p>
                        <p className="text-xs text-muted-foreground">Severity: {message.severity}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No active form corrections. Keep moving with control.</p>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-background/70 p-4 shadow-inset">
                  <p className="text-sm font-semibold">Environment checks</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {lightingScore < 0.32
                      ? 'Low light detected. Add more front lighting for better landmark quality.'
                      : 'Lighting looks good for landmark tracking.'}
                  </p>
                </div>
                <div className="rounded-2xl bg-background/70 p-4 shadow-inset">
                  <p className="text-sm font-semibold">Performance checks</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {inferenceLag > 120
                      ? 'Frame processing is lagging. Close other apps or lower camera resolution if needed.'
                      : 'Latency is within a responsive coaching range.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={Boolean(summarySession)} onOpenChange={(open) => !open && setSummarySession(null)}>
        <DialogContent>
          {summarySession ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="font-display text-2xl">Workout complete</DialogTitle>
                  <DialogDescription>Here is your reward summary, form analysis, and next-step coaching.</DialogDescription>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl bg-background/70 p-4 shadow-inset">
                  <p className="text-sm text-muted-foreground">Reps</p>
                  <p className="text-2xl font-semibold">{summarySession.repsCompleted}</p>
                </div>
                <div className="rounded-2xl bg-background/70 p-4 shadow-inset">
                  <p className="text-sm text-muted-foreground">Form</p>
                  <p className="text-2xl font-semibold">{summarySession.averageFormScore}%</p>
                </div>
                <div className="rounded-2xl bg-background/70 p-4 shadow-inset">
                  <p className="text-sm text-muted-foreground">Calories</p>
                  <p className="text-2xl font-semibold">{summarySession.caloriesBurned}</p>
                </div>
                <div className="rounded-2xl bg-background/70 p-4 shadow-inset">
                  <p className="text-sm text-muted-foreground">XP</p>
                  <p className="text-2xl font-semibold">+{summarySession.xpGained}</p>
                </div>
              </div>
              <div className="rounded-2xl bg-background/70 p-4 shadow-inset">
                <p className="font-semibold">Most important corrections</p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {summarySession.recommendations.length > 0 ? (
                    summarySession.recommendations.map((item) => <li key={item}>• {item}</li>)
                  ) : (
                    <li>• Strong session. No recurring corrections were detected.</li>
                  )}
                </ul>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

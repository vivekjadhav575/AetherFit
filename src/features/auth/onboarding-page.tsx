import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Activity, ArrowRight, Shield, Sparkles, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { isFirebaseAvailable, signInWithGoogle } from '@/lib/firebase'
import { useAppStore } from '@/store/app-store'

const onboardingSchema = z.object({
  name: z.string().min(2),
  age: z.coerce.number().min(13).max(90),
  gender: z.string().min(1),
  heightCm: z.coerce.number().min(120).max(230),
  weightKg: z.coerce.number().min(30).max(220),
  targetWeightKg: z.coerce.number().min(30).max(220),
  dailyCalorieTarget: z.coerce.number().min(1200).max(4500),
  waterGoalMl: z.coerce.number().min(1200).max(5000),
  goalType: z.enum(['fat_loss', 'muscle_gain', 'performance', 'mobility', 'wellness']),
  experienceLevel: z.enum(['Beginner', 'Intermediate', 'Pro', 'Athlete']),
  preferredWorkoutStyle: z.string().min(2),
  notificationOptIn: z.boolean(),
})

type OnboardingFormValues = z.output<typeof onboardingSchema>
type OnboardingFormInput = z.input<typeof onboardingSchema>

const defaultValues: OnboardingFormValues = {
  name: 'Guest Athlete',
  age: 28,
  gender: 'Prefer not to say',
  heightCm: 170,
  weightKg: 70,
  targetWeightKg: 68,
  dailyCalorieTarget: 2200,
  waterGoalMl: 2600,
  goalType: 'wellness',
  experienceLevel: 'Beginner',
  preferredWorkoutStyle: 'Balanced',
  notificationOptIn: true,
}

function FieldLabel({ title, helper }: { title: string; helper?: string }) {
  return (
    <div className="mb-2">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  )
}

export function OnboardingPage() {
  const completeOnboarding = useAppStore((state) => state.completeOnboarding)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const form = useForm<OnboardingFormInput, undefined, OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues,
  })

  const values = useWatch({ control: form.control })
  const featureCards: Array<{ title: string; description: string; icon: LucideIcon }> = [
    { title: 'Live AI coach', description: 'MediaPipe-powered movement feedback with real-time guidance.', icon: Activity },
    { title: 'Gamified progress', description: 'XP, badges, streaks, quests, and unlockable levels that mean something.', icon: Sparkles },
    { title: 'Privacy-first sync', description: 'Landmark-first storage, optional Google sync, and offline access.', icon: Shield },
  ]

  async function finish(valuesToSave: OnboardingFormValues, authMode: 'guest' | 'google') {
    setSubmitting(true)
    try {
      let userPayload: {
        id?: string
        authMode: 'guest' | 'google'
        email?: string
        displayName: string
        photoUrl?: string
      } = { authMode, displayName: valuesToSave.name }
      if (authMode === 'google') {
        if (!isFirebaseAvailable()) {
          toast.error('Firebase is not configured. Use guest mode or add env values first.')
          setSubmitting(false)
          return
        }
        const firebaseUser = await signInWithGoogle()
        if (!firebaseUser) {
          toast.error('Google sign-in did not return a user session.')
          setSubmitting(false)
          return
        }
        userPayload = {
          id: firebaseUser.uid,
          authMode: 'google',
          email: firebaseUser.email ?? undefined,
          displayName: firebaseUser.displayName ?? valuesToSave.name,
          photoUrl: firebaseUser.photoURL ?? undefined,
        }
      }

      await completeOnboarding({
        user: userPayload,
        profile: {
          name: valuesToSave.name,
          age: valuesToSave.age,
          gender: valuesToSave.gender,
          heightCm: valuesToSave.heightCm,
          weightKg: valuesToSave.weightKg,
          targetWeightKg: valuesToSave.targetWeightKg,
          dailyCalorieTarget: valuesToSave.dailyCalorieTarget,
          waterGoalMl: valuesToSave.waterGoalMl,
          goalType: valuesToSave.goalType,
          experienceLevel: valuesToSave.experienceLevel,
          preferredWorkoutStyle: valuesToSave.preferredWorkoutStyle,
          notificationOptIn: valuesToSave.notificationOptIn,
        },
        goals: [
          {
            id: 'goal-workouts-week',
            title: 'Complete 4 workouts per week',
            type: valuesToSave.goalType,
            targetValue: 4,
            unit: 'workouts/week',
            currentValue: 0,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'goal-hydration',
            title: 'Hit hydration goal five days this week',
            type: 'wellness',
            targetValue: 5,
            unit: 'days',
            currentValue: 0,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        settings: {
          reminders: {
            workoutReminder: '18:30',
            hydrationReminderIntervalMin: 90,
            mealReminderTimes: ['08:00', '13:00', '19:00'],
            weeklySummaryDay: 0,
            recoveryPromptEnabled: valuesToSave.notificationOptIn,
            browserNotificationsEnabled: false,
            updatedAt: new Date().toISOString(),
          },
        },
      })
      navigate('/')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.25),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.28),transparent_26%),linear-gradient(160deg,rgba(255,255,255,0.92),rgba(241,245,249,0.88))] p-8 shadow-lifted dark:bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.24),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.18),transparent_24%),linear-gradient(160deg,rgba(15,23,42,0.96),rgba(15,23,42,0.88))] lg:p-10"
        >
          <div className="mb-10 flex items-center gap-4">
            <div className="rounded-[24px] bg-primary px-4 py-3 font-display text-2xl font-bold text-primary-foreground shadow-soft">A</div>
            <div>
              <p className="font-display text-3xl font-semibold">AetherFit</p>
              <p className="text-sm text-muted-foreground">Gamified fitness, posture coaching, and wellness tracking in one system.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {featureCards.map((item) => (
              <Card key={item.title} className="bg-white/65 dark:bg-slate-900/55">
                <CardContent className="space-y-3">
                  <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 rounded-[28px] bg-card/70 p-6 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Personalized preview</p>
            <h2 className="mt-2 font-display text-3xl font-semibold">
              {values.goalType === 'fat_loss'
                ? 'Lean momentum plan'
                : values.goalType === 'muscle_gain'
                  ? 'Strength and hypertrophy path'
                  : values.goalType === 'performance'
                    ? 'Athletic performance lane'
                    : values.goalType === 'mobility'
                      ? 'Mobility-first reset'
                      : 'Wellness consistency plan'}
            </h2>
            <p className="mt-2 text-muted-foreground">
              Based on your inputs, the app will tailor live coaching thresholds, reminders, analytics depth, and plan recommendations from day one.
            </p>
          </div>
        </motion.div>

        <Card className="bg-card/90 p-1">
          <CardHeader className="p-6 pb-0">
            <div>
              <CardTitle className="text-2xl">Set up your profile</CardTitle>
              <CardDescription>Start in guest mode or connect Google now. You can change these settings later.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form
              className="space-y-5"
              onSubmit={form.handleSubmit(async (formValues) => {
                await finish(formValues, 'guest')
              })}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel title="Name" />
                  <Input aria-label="Name" {...form.register('name')} />
                </div>
                <div>
                  <FieldLabel title="Age" />
                  <Input aria-label="Age" type="number" {...form.register('age')} />
                </div>
                <div>
                  <FieldLabel title="Gender" />
                  <Input aria-label="Gender" {...form.register('gender')} />
                </div>
                <div>
                  <FieldLabel title="Preferred workout style" />
                  <Input aria-label="Preferred workout style" {...form.register('preferredWorkoutStyle')} />
                </div>
                <div>
                  <FieldLabel title="Height (cm)" />
                  <Input aria-label="Height (cm)" type="number" {...form.register('heightCm')} />
                </div>
                <div>
                  <FieldLabel title="Weight (kg)" />
                  <Input aria-label="Weight (kg)" type="number" {...form.register('weightKg')} />
                </div>
                <div>
                  <FieldLabel title="Target weight (kg)" />
                  <Input aria-label="Target weight (kg)" type="number" {...form.register('targetWeightKg')} />
                </div>
                <div>
                  <FieldLabel title="Water goal (ml)" />
                  <Input aria-label="Water goal (ml)" type="number" {...form.register('waterGoalMl')} />
                </div>
                <div>
                  <FieldLabel title="Daily calories" />
                  <Input aria-label="Daily calories" type="number" {...form.register('dailyCalorieTarget')} />
                </div>
                <div>
                  <FieldLabel title="Primary goal" />
                  <Select value={values.goalType} onValueChange={(value) => form.setValue('goalType', value as OnboardingFormValues['goalType'])}>
                    <SelectTrigger aria-label="Primary goal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wellness">Wellness</SelectItem>
                      <SelectItem value="fat_loss">Fat loss</SelectItem>
                      <SelectItem value="muscle_gain">Muscle gain</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="mobility">Mobility</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <FieldLabel title="Experience level" />
                  <Select
                    value={values.experienceLevel}
                    onValueChange={(value) => form.setValue('experienceLevel', value as OnboardingFormValues['experienceLevel'])}
                  >
                    <SelectTrigger aria-label="Experience level">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Pro">Pro</SelectItem>
                      <SelectItem value="Athlete">Athlete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-background/70 p-4 shadow-inset">
                <div>
                  <p className="font-semibold">Enable reminders</p>
                  <p className="text-sm text-muted-foreground">Workout, hydration, meal, and recovery prompts.</p>
                </div>
                <Switch
                  aria-label="Enable reminders"
                  checked={values.notificationOptIn}
                  onCheckedChange={(checked) => form.setValue('notificationOptIn', checked)}
                />
              </div>

              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
                This product provides fitness guidance and wellness tracking only. It does not provide medical advice and does not claim clinical accuracy.
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" className="flex-1" disabled={submitting}>
                  Start in guest mode
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  disabled={submitting}
                  onClick={form.handleSubmit(async (formValues) => {
                    await finish(formValues, 'google')
                  })}
                >
                  Connect Google and continue
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

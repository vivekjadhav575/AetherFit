import { zodResolver } from '@hookform/resolvers/zod'
import { Award, Download, Goal, ShieldCheck, Trash2, UserCog } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { SectionHeader } from '@/components/shared/section-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { levelUnlocks } from '@/features/gamification/leveling'
import { exportSnapshotJson, exportWorkoutCsv } from '@/services/export-service'
import { useAppStore } from '@/store/app-store'

const profileSchema = z.object({
  name: z.string().min(2),
  age: z.coerce.number().min(13).max(90),
  heightCm: z.coerce.number().min(120).max(230),
  weightKg: z.coerce.number().min(30).max(220),
  targetWeightKg: z.coerce.number().min(30).max(220),
  preferredWorkoutStyle: z.string().min(2),
  dailyCalorieTarget: z.coerce.number().min(1200).max(4500),
  waterGoalMl: z.coerce.number().min(1200).max(5000),
})

type ProfileValues = z.output<typeof profileSchema>
type ProfileInput = z.input<typeof profileSchema>

export function ProfilePage() {
  const snapshot = useAppStore((state) => state.snapshot)
  const updateProfile = useAppStore((state) => state.updateProfile)
  const replaceSnapshot = useAppStore((state) => state.replaceSnapshot)
  const addTrainerAssignment = useAppStore((state) => state.addTrainerAssignment)
  const removeTrainerAssignment = useAppStore((state) => state.removeTrainerAssignment)
  const [selectedPlanId, setSelectedPlanId] = useState(snapshot.workoutPlans[0]?.id ?? 'beginner-foundation')
  const [assigneeName, setAssigneeName] = useState(snapshot.profile.name)
  const [assignmentNotes, setAssignmentNotes] = useState('Focus on technique quality and hydration adherence this week.')
  const form = useForm<ProfileInput, undefined, ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: snapshot.profile.name,
      age: snapshot.profile.age,
      heightCm: snapshot.profile.heightCm,
      weightKg: snapshot.profile.weightKg,
      targetWeightKg: snapshot.profile.targetWeightKg,
      preferredWorkoutStyle: snapshot.profile.preferredWorkoutStyle,
      dailyCalorieTarget: snapshot.profile.dailyCalorieTarget,
      waterGoalMl: snapshot.profile.waterGoalMl,
    },
  })

  const bmi = Number((snapshot.profile.weightKg / ((snapshot.profile.heightCm / 100) ** 2)).toFixed(1))
  const unlockedBadges = snapshot.badges.filter((badge) => badge.unlocked)

  async function saveAssignment() {
    await addTrainerAssignment({
      id: `assignment-${crypto.randomUUID()}`,
      planId: selectedPlanId,
      assigneeName,
      notes: assignmentNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    setAssignmentNotes('Focus on technique quality and hydration adherence this week.')
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Profile and progression"
        title="Profile, goals, badges, and trainer tools"
        description="Manage personal details, milestone unlocks, privacy defaults, and optional trainer assignments."
        action={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => exportSnapshotJson(snapshot)}>
              <Download className="h-4 w-4" />
              Export JSON
            </Button>
            <Button variant="secondary" onClick={() => exportWorkoutCsv(snapshot)}>
              <Download className="h-4 w-4" />
              Export workout CSV
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Profile basics</CardTitle>
              <CardDescription>These values drive analytics, nutrition insights, and level recommendations.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(async (values) => updateProfile(values))}>
              <div className="md:col-span-2"><p className="mb-2 text-sm font-semibold">Name</p><Input aria-label="Profile name" {...form.register('name')} /></div>
              <div><p className="mb-2 text-sm font-semibold">Age</p><Input aria-label="Profile age" type="number" {...form.register('age')} /></div>
              <div><p className="mb-2 text-sm font-semibold">Preferred style</p><Input aria-label="Preferred style" {...form.register('preferredWorkoutStyle')} /></div>
              <div><p className="mb-2 text-sm font-semibold">Height (cm)</p><Input aria-label="Height (cm)" type="number" {...form.register('heightCm')} /></div>
              <div><p className="mb-2 text-sm font-semibold">Weight (kg)</p><Input aria-label="Weight (kg)" type="number" {...form.register('weightKg')} /></div>
              <div><p className="mb-2 text-sm font-semibold">Target weight (kg)</p><Input aria-label="Target weight (kg)" type="number" {...form.register('targetWeightKg')} /></div>
              <div><p className="mb-2 text-sm font-semibold">Daily calorie target</p><Input aria-label="Daily calorie target" type="number" {...form.register('dailyCalorieTarget')} /></div>
              <div><p className="mb-2 text-sm font-semibold">Water goal (ml)</p><Input aria-label="Water goal (ml)" type="number" {...form.register('waterGoalMl')} /></div>
              <div className="rounded-2xl bg-background/70 p-4 shadow-inset md:col-span-2">
                <p className="text-sm text-muted-foreground">BMI</p>
                <p className="text-2xl font-semibold">{bmi}</p>
                <p className="text-sm text-muted-foreground">This metric is informational only and does not replace professional guidance.</p>
              </div>
              <Button type="submit" className="md:col-span-2">Save profile changes</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><div><CardTitle>Level map</CardTitle><CardDescription>Unlocks depend on XP, streak, form quality, and completed goals.</CardDescription></div></CardHeader>
            <CardContent className="space-y-3">
              {levelUnlocks.map((level) => (
                <div key={level.title} className="rounded-2xl bg-background/70 p-4 shadow-inset">
                  <div className="mb-2 flex items-center justify-between"><p className="font-semibold">{level.title}</p><Badge variant={snapshot.levelProgress.currentLevel === level.title ? 'success' : 'secondary'}>{level.minXp} XP</Badge></div>
                  <p className="text-sm text-muted-foreground">Streak {level.minStreak}+ | Form {level.minAverageFormScore}+ | Goals {level.minGoalsCompleted}+</p>
                  <div className="mt-3 flex flex-wrap gap-2">{level.features.map((feature) => <Badge key={feature} variant="muted">{feature}</Badge>)}</div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><div><CardTitle>Unlocked badges</CardTitle><CardDescription>Meaningful milestones tied to consistency, technique, and goal completion.</CardDescription></div></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {unlockedBadges.map((badge) => (
                <div key={badge.id} className="rounded-2xl bg-background/70 p-4 shadow-inset">
                  <div className="mb-2 flex items-center gap-2"><Award className="h-4 w-4 text-primary" /><p className="font-semibold">{badge.name}</p></div>
                  <p className="text-sm text-muted-foreground">{badge.description}</p>
                </div>
              ))}
              {unlockedBadges.length === 0 ? <div className="rounded-2xl bg-background/70 p-4 text-sm text-muted-foreground shadow-inset md:col-span-2">Keep training and logging wellness data to start unlocking badges.</div> : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader><div><CardTitle>Trainer and admin mode</CardTitle><CardDescription>Optional planning tools for coaches, accountability partners, or self-programming power users.</CardDescription></div></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-background/70 p-4 shadow-inset"><p className="font-semibold">Current role</p><p className="mt-1 text-sm text-muted-foreground">{snapshot.user.role}</p></div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => void replaceSnapshot({ ...snapshot, user: { ...snapshot.user, role: 'trainer', updatedAt: new Date().toISOString() } })}><UserCog className="h-4 w-4" />Enable trainer mode</Button>
              <Button variant="outline" onClick={() => void replaceSnapshot({ ...snapshot, user: { ...snapshot.user, role: 'member', updatedAt: new Date().toISOString() } })}><ShieldCheck className="h-4 w-4" />Standard mode</Button>
            </div>
            <div className="space-y-4 rounded-2xl bg-background/70 p-4 shadow-inset">
              <div>
                <p className="mb-2 text-sm font-semibold">Plan</p>
                <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                  <SelectTrigger aria-label="Trainer plan">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {snapshot.workoutPlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold">Assignee</p>
                <Input aria-label="Trainer assignee" value={assigneeName} onChange={(event) => setAssigneeName(event.target.value)} />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold">Coach notes</p>
                <Textarea aria-label="Coach notes" value={assignmentNotes} onChange={(event) => setAssignmentNotes(event.target.value)} className="min-h-[110px]" />
              </div>
              <Button onClick={() => void saveAssignment()} disabled={!selectedPlanId || !assigneeName.trim() || !assignmentNotes.trim()}>
                <Goal className="h-4 w-4" />
                Save trainer assignment
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><div><CardTitle>Assigned plans and coach notes</CardTitle><CardDescription>Review active assignments, guidance notes, and progress directives.</CardDescription></div></CardHeader>
          <CardContent className="space-y-3">
            {snapshot.trainerAssignments.map((assignment) => (
              <div key={assignment.id} className="rounded-2xl bg-background/70 p-4 shadow-inset">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{snapshot.workoutPlans.find((plan) => plan.id === assignment.planId)?.title ?? assignment.planId}</p>
                    <p className="text-sm text-muted-foreground">Assigned to {assignment.assigneeName}</p>
                  </div>
                  <Button variant="outline" size="icon" aria-label={`Delete assignment for ${assignment.assigneeName}`} onClick={() => void removeTrainerAssignment(assignment.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea readOnly value={assignment.notes} className="min-h-[88px]" />
              </div>
            ))}
            {snapshot.trainerAssignments.length === 0 ? <div className="rounded-2xl bg-background/70 p-4 text-sm text-muted-foreground shadow-inset">No trainer assignments yet. Enable trainer mode to assign plans or export reports for review.</div> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

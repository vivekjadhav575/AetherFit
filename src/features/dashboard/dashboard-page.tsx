import {
  Activity,
  Award,
  Droplets,
  Flame,
  GlassWater,
  MoonStar,
  Sparkles,
  Target,
  TimerReset,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { SectionHeader } from '@/components/shared/section-header'
import { StatCard } from '@/components/shared/stat-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { formatDate, formatNumber } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import { getDailyMealTotals, getDailyWaterTotal } from '@/features/nutrition/nutrition-utils'

export function DashboardPage() {
  const snapshot = useAppStore((state) => state.snapshot)
  const recommendations = useAppStore((state) => state.recommendations)
  const today = new Date().toISOString().slice(0, 10)
  const todayMeals = getDailyMealTotals(snapshot.mealEntries, today)
  const waterTotal = getDailyWaterTotal(snapshot.waterEntries, today)
  const latestSleep = snapshot.sleepEntries.find((entry) => entry.date === today)?.durationHours ?? 0
  const latestWeight = snapshot.weightEntries[0]?.weightKg ?? snapshot.profile.weightKg
  const recentSessions = snapshot.workoutSessions.slice(0, 3)
  const unlockedBadges = snapshot.badges.filter((badge) => badge.unlocked).slice(0, 4)
  const levelPercent =
    snapshot.levelProgress.currentLevel === 'Athlete'
      ? 100
      : 100 - (snapshot.levelProgress.xpToNextLevel / Math.max(snapshot.levelProgress.xp + snapshot.levelProgress.xpToNextLevel, 1)) * 100

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Daily dashboard"
        title={`Welcome back, ${snapshot.profile.name.split(' ')[0]}`}
        description="Your next workout, recovery status, and smart recommendations are all in one place."
        action={
          <div className="flex gap-3">
            <Button asChild>
              <Link to="/coach">Start live workout</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/nutrition">Log meal</Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Flame} title="Current streak" value={`${snapshot.levelProgress.currentStreak} days`} helper="Keep the streak alive today." trend={12} />
        <StatCard icon={Sparkles} title="Lifetime XP" value={formatNumber(snapshot.levelProgress.xp)} helper={`${snapshot.levelProgress.xpToNextLevel} XP to next rank`} trend={8} />
        <StatCard icon={Droplets} title="Hydration" value={`${waterTotal} ml`} helper={`${Math.max(snapshot.profile.waterGoalMl - waterTotal, 0)} ml remaining`} trend={waterTotal >= snapshot.profile.waterGoalMl ? 5 : -3} />
        <StatCard icon={MoonStar} title="Sleep" value={`${latestSleep.toFixed(1)} h`} helper="Recovery drives better form and consistency." trend={latestSleep >= 7 ? 6 : -4} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Progress to next unlock</CardTitle>
              <CardDescription>{snapshot.levelProgress.currentLevel} rank with feature-based progression.</CardDescription>
            </div>
            <Badge variant="success">{snapshot.levelProgress.currentLevel}</Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-[24px] bg-background/75 p-5 shadow-inset">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Level progress</p>
                  <p className="font-display text-3xl font-semibold">{formatNumber(snapshot.levelProgress.xp)} XP</p>
                </div>
                <Target className="h-8 w-8 text-primary" />
              </div>
              <Progress value={levelPercent} />
              <p className="mt-3 text-sm text-muted-foreground">{snapshot.levelProgress.xpToNextLevel} XP remains to unlock the next tier and feature bundle.</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-background/70 p-4 shadow-inset">
                <p className="text-sm text-muted-foreground">Daily calories</p>
                <p className="mt-1 text-2xl font-semibold">{todayMeals.calories}</p>
                <p className="text-sm text-muted-foreground">Target {snapshot.profile.dailyCalorieTarget} kcal</p>
              </div>
              <div className="rounded-2xl bg-background/70 p-4 shadow-inset">
                <p className="text-sm text-muted-foreground">Current weight</p>
                <p className="mt-1 text-2xl font-semibold">{latestWeight} kg</p>
                <p className="text-sm text-muted-foreground">Goal {snapshot.profile.targetWeightKg} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Daily quests</CardTitle>
              <CardDescription>Short, meaningful wins that accelerate your XP and streak momentum.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {snapshot.quests.map((quest) => (
              <div key={quest.id} className="rounded-2xl bg-background/70 p-4 shadow-inset">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{quest.title}</p>
                    <p className="text-sm text-muted-foreground">{quest.description}</p>
                  </div>
                  <Badge variant={quest.completed ? 'success' : 'secondary'}>{quest.rewardXp} XP</Badge>
                </div>
                <Progress value={(quest.progress / quest.target) * 100} />
                <p className="mt-2 text-xs text-muted-foreground">
                  {quest.progress} of {quest.target} complete
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Coach recommendations</CardTitle>
              <CardDescription>Data-driven nudges from your recent movement, nutrition, and recovery patterns.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.length === 0 ? (
              <div className="rounded-2xl bg-background/70 p-4 text-sm text-muted-foreground shadow-inset">
                Keep logging workouts, meals, and recovery data to unlock smarter recommendations.
              </div>
            ) : (
              recommendations.map((recommendation) => (
                <div key={recommendation.id} className="rounded-2xl bg-background/70 p-4 shadow-inset">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-semibold">{recommendation.title}</p>
                    <Badge variant={recommendation.priority === 'critical' ? 'danger' : recommendation.priority === 'warning' ? 'warning' : 'default'}>
                      {recommendation.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{recommendation.reason}</p>
                  <p className="mt-2 text-sm font-medium text-foreground">{recommendation.action}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recent activity and wins</CardTitle>
              <CardDescription>Workouts, unlocks, and badge progress from your latest sessions.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              {recentSessions.map((session) => (
                <div key={session.id} className="rounded-2xl bg-background/70 p-4 shadow-inset">
                  <div className="mb-2 flex items-center justify-between">
                    <Badge variant="secondary">{session.exerciseId}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(session.completedAt ?? session.startedAt)}</span>
                  </div>
                  <p className="text-lg font-semibold">{session.repsCompleted} reps</p>
                  <p className="text-sm text-muted-foreground">
                    {session.averageFormScore}% form score • {session.xpGained} XP • {session.caloriesBurned} kcal
                  </p>
                </div>
              ))}
              {recentSessions.length === 0 ? (
                <div className="rounded-2xl bg-background/70 p-4 text-sm text-muted-foreground shadow-inset md:col-span-2">
                  Start your first live workout to populate session history, XP, and trend analytics.
                </div>
              ) : null}
            </div>

            <div className="rounded-[24px] bg-background/70 p-4 shadow-inset">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold">Unlocked badges</p>
                  <p className="text-sm text-muted-foreground">Meaningful milestones based on consistency and quality.</p>
                </div>
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-wrap gap-2">
                {unlockedBadges.length > 0 ? (
                  unlockedBadges.map((badge) => (
                    <Badge key={badge.id} variant="success">
                      {badge.name}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="muted">First badge waiting</Badge>
                )}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-background/70 p-4 shadow-inset">
                <GlassWater className="mb-2 h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">Protein</p>
                <p className="text-2xl font-semibold">{todayMeals.protein} g</p>
              </div>
              <div className="rounded-2xl bg-background/70 p-4 shadow-inset">
                <TimerReset className="mb-2 h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">Workouts logged</p>
                <p className="text-2xl font-semibold">{snapshot.workoutSessions.length}</p>
              </div>
              <div className="rounded-2xl bg-background/70 p-4 shadow-inset">
                <Activity className="mb-2 h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">Habits complete</p>
                <p className="text-2xl font-semibold">{snapshot.habitEntries.filter((habit) => habit.completed).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

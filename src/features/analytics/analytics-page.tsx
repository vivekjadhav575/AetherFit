import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { SectionHeader } from '@/components/shared/section-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { buildMuscleDistribution, buildTrendSeries } from '@/features/analytics/analytics-service'
import { useAppStore } from '@/store/app-store'

export function AnalyticsPage() {
  const snapshot = useAppStore((state) => state.snapshot)
  const recommendations = useAppStore((state) => state.recommendations)
  const weeklyTrend = buildTrendSeries(snapshot, 7)
  const monthlyTrend = buildTrendSeries(snapshot, 30)
  const muscleDistribution = buildMuscleDistribution(snapshot)
  const personalBest = snapshot.workoutSessions.reduce(
    (best, session) => {
      if (!best || session.repsCompleted > best.repsCompleted) return session
      return best
    },
    snapshot.workoutSessions[0],
  )

  return (
    <div className="space-y-8">
      <SectionHeader eyebrow="Analytics" title="Performance and wellness insights" description="View day, week, and month trends across workouts, form quality, recovery, and nutrition." />
      <Tabs defaultValue="week" className="space-y-5">
        <TabsList>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="month">Month</TabsTrigger>
        </TabsList>
        <TabsContent value="week" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <CardHeader><div><CardTitle>Workout and XP trend</CardTitle><CardDescription>Track workout count, XP gained, and calories burned across the last seven days.</CardDescription></div></CardHeader>
              <CardContent className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                    <XAxis dataKey="date" /><YAxis /><Tooltip /><Legend />
                    <Line type="monotone" dataKey="xp" stroke="#38bdf8" strokeWidth={3} />
                    <Line type="monotone" dataKey="caloriesBurned" stroke="#14b8a6" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><div><CardTitle>Muscle group distribution</CardTitle><CardDescription>Total training minutes distributed across target muscle groups.</CardDescription></div></CardHeader>
              <CardContent className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={muscleDistribution} dataKey="value" nameKey="name" outerRadius={110} fill="#38bdf8" /><Tooltip /></PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <Card>
              <CardHeader><div><CardTitle>Form accuracy and hydration</CardTitle><CardDescription>See how movement quality and hydration compare during the week.</CardDescription></div></CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                    <XAxis dataKey="date" /><YAxis /><Tooltip /><Legend />
                    <Bar dataKey="formAccuracy" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="hydration" fill="#2dd4bf" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><div><CardTitle>Key recommendations</CardTitle><CardDescription>Insights generated from recent trends, consistency, recovery, and technique.</CardDescription></div></CardHeader>
              <CardContent className="space-y-3">
                {recommendations.map((recommendation) => (
                  <div key={recommendation.id} className="rounded-2xl bg-background/70 p-4 shadow-inset">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-semibold">{recommendation.title}</p>
                      <Badge variant={recommendation.priority === 'critical' ? 'danger' : recommendation.priority === 'warning' ? 'warning' : 'default'}>{recommendation.priority}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{recommendation.reason}</p>
                    <p className="mt-2 text-sm font-medium">{recommendation.action}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="month" className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader><div><CardTitle>Monthly wellness trend</CardTitle><CardDescription>Calories, sleep, and rep totals across the last month.</CardDescription></div></CardHeader>
            <CardContent className="h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                  <XAxis dataKey="date" minTickGap={16} /><YAxis /><Tooltip /><Legend />
                  <Line type="monotone" dataKey="mealCalories" stroke="#f59e0b" strokeWidth={2} />
                  <Line type="monotone" dataKey="sleep" stroke="#8b5cf6" strokeWidth={2} />
                  <Line type="monotone" dataKey="reps" stroke="#22c55e" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><div><CardTitle>Personal bests</CardTitle><CardDescription>Highlights from your strongest recent session data.</CardDescription></div></CardHeader>
            <CardContent className="space-y-4">
              {personalBest ? (
                <div className="rounded-[24px] bg-background/70 p-5 shadow-inset">
                  <p className="text-sm text-muted-foreground">Highest rep session</p>
                  <p className="mt-1 font-display text-3xl font-semibold">{personalBest.repsCompleted} reps</p>
                  <p className="mt-2 text-sm text-muted-foreground">{personalBest.exerciseId} • {personalBest.averageFormScore}% form • {personalBest.xpGained} XP</p>
                </div>
              ) : (
                <div className="rounded-[24px] bg-background/70 p-5 text-sm text-muted-foreground shadow-inset">Complete a workout to populate personal bests and period-over-period comparisons.</div>
              )}
              <div className="rounded-[24px] bg-background/70 p-5 shadow-inset">
                <p className="text-sm text-muted-foreground">Current rank</p>
                <p className="mt-1 font-display text-3xl font-semibold">{snapshot.levelProgress.currentLevel}</p>
                <p className="mt-2 text-sm text-muted-foreground">Longest streak: {snapshot.levelProgress.longestStreak} days • Average form {snapshot.levelProgress.averageFormScore}%</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

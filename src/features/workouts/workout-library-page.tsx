import { Heart, Search, Star, Timer } from 'lucide-react'
import { startTransition, useDeferredValue, useState } from 'react'

import { ExerciseDemo } from '@/components/shared/exercise-demo'
import { SectionHeader } from '@/components/shared/section-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore } from '@/store/app-store'

export function WorkoutLibraryPage() {
  const snapshot = useAppStore((state) => state.snapshot)
  const toggleFavorite = useAppStore((state) => state.toggleFavorite)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [difficulty, setDifficulty] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'featured' | 'calories' | 'difficulty'>('featured')
  const deferredQuery = useDeferredValue(query)

  const filteredExercises = snapshot.exercises
    .filter((exercise) => {
      const matchesQuery =
        exercise.name.toLowerCase().includes(deferredQuery.toLowerCase()) ||
        exercise.targetMuscles.join(' ').toLowerCase().includes(deferredQuery.toLowerCase())
      const matchesCategory = category === 'all' || exercise.category === category
      const matchesDifficulty = difficulty === 'all' || exercise.difficulty === difficulty
      return matchesQuery && matchesCategory && matchesDifficulty
    })
    .sort((left, right) => {
      if (sortBy === 'calories') return right.caloriesPerMinute - left.caloriesPerMinute
      if (sortBy === 'difficulty') return left.difficulty.localeCompare(right.difficulty)
      return Number(snapshot.favorites.includes(right.id)) - Number(snapshot.favorites.includes(left.id))
    })

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Exercise catalog"
        title="Workout library and plan system"
        description="Search by focus area, favorite your staples, and browse curated plans that unlock as your level evolves."
      />

      <Card>
        <CardContent className="grid gap-4 p-5 md:grid-cols-[1.2fr_repeat(3,minmax(0,0.5fr))]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10" placeholder="Search exercises, muscle groups, or equipment" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <Select value={category} onValueChange={(value) => startTransition(() => setCategory(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {['chest', 'back', 'legs', 'arms', 'shoulders', 'core', 'cardio', 'mobility', 'yoga', 'warm-up', 'cool-down'].map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={difficulty} onValueChange={(value) => setDifficulty(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              {['Beginner', 'Intermediate', 'Pro', 'Athlete'].map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
            <SelectTrigger>
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="calories">Calories</SelectItem>
              <SelectItem value="difficulty">Difficulty</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Tabs defaultValue="exercises" className="space-y-5">
        <TabsList>
          <TabsTrigger value="exercises">Exercises</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
        </TabsList>

        <TabsContent value="exercises" className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filteredExercises.map((exercise) => (
            <Card key={exercise.id} className="overflow-hidden">
              <ExerciseDemo exercise={exercise} />
              <CardContent className="space-y-4 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{exercise.name}</CardTitle>
                    <CardDescription>{exercise.description}</CardDescription>
                  </div>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => {
                      void toggleFavorite(exercise.id)
                    }}
                  >
                    <Heart className={`h-4 w-4 ${snapshot.favorites.includes(exercise.id) ? 'fill-current text-rose-500' : ''}`} />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{exercise.category}</Badge>
                  <Badge variant="default">{exercise.difficulty}</Badge>
                  <Badge variant={exercise.supportedForRealtime ? 'success' : 'muted'}>
                    {exercise.supportedForRealtime ? 'Live coach ready' : 'Library only'}
                  </Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-background/70 p-3 shadow-inset">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Target muscles</p>
                    <p className="mt-2 text-sm font-medium">{exercise.targetMuscles.join(', ')}</p>
                  </div>
                  <div className="rounded-2xl bg-background/70 p-3 shadow-inset">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Equipment</p>
                    <p className="mt-2 text-sm font-medium">{exercise.equipment.join(', ')}</p>
                  </div>
                  <div className="rounded-2xl bg-background/70 p-3 shadow-inset">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Suggested work</p>
                    <p className="mt-2 text-sm font-medium">{exercise.suggestedReps ?? `${exercise.suggestedDurationMin} min`}</p>
                  </div>
                  <div className="rounded-2xl bg-background/70 p-3 shadow-inset">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Calories</p>
                    <p className="mt-2 text-sm font-medium">{exercise.caloriesPerMinute} kcal / min</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold">Form tips</p>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {exercise.formTips.map((tip) => (
                        <li key={tip}>• {tip}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Common mistakes</p>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {exercise.commonMistakes.map((mistake) => (
                        <li key={mistake}>• {mistake}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="plans" className="grid gap-4 lg:grid-cols-2">
          {snapshot.workoutPlans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <div>
                  <CardTitle>{plan.title}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </div>
                <Badge variant={snapshot.levelProgress.currentLevel === plan.unlockLevel || plan.unlockLevel === 'Beginner' ? 'success' : 'warning'}>
                  Unlocks at {plan.unlockLevel}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{plan.goalType}</Badge>
                  <Badge variant="secondary">{plan.workoutStyle}</Badge>
                  <Badge variant="default">
                    <Timer className="mr-1 h-3.5 w-3.5" />
                    {plan.estimatedMinutes} min
                  </Badge>
                </div>
                <div className="space-y-2 rounded-2xl bg-background/70 p-4 shadow-inset">
                  {plan.items.map((item) => (
                    <div key={`${plan.id}-${item.exerciseId}`} className="flex items-center justify-between text-sm">
                      <span>{snapshot.exercises.find((exercise) => exercise.id === item.exerciseId)?.name ?? item.exerciseId}</span>
                      <span className="text-muted-foreground">
                        {item.sets} sets • {item.reps}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="recent" className="grid gap-4 lg:grid-cols-2">
          {snapshot.recentExerciseIds.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                Your recent exercises will appear here once you finish a live coached workout.
              </CardContent>
            </Card>
          ) : (
            snapshot.recentExerciseIds.map((exerciseId) => {
              const exercise = snapshot.exercises.find((item) => item.id === exerciseId)
              if (!exercise) return null
              return (
                <Card key={exercise.id}>
                  <CardHeader>
                    <div>
                      <CardTitle>{exercise.name}</CardTitle>
                      <CardDescription>{exercise.description}</CardDescription>
                    </div>
                    <Star className="h-5 w-5 text-primary" />
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {exercise.targetMuscles.map((muscle) => (
                      <Badge key={muscle} variant="secondary">
                        {muscle}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

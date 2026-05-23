import { zodResolver } from '@hookform/resolvers/zod'
import { Droplets, MoonStar, SmilePlus, Weight } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import { SectionHeader } from '@/components/shared/section-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { buildNutritionInsight, getDailyMealTotals, getDailyWaterTotal } from '@/features/nutrition/nutrition-utils'
import { useAppStore } from '@/store/app-store'
import type { MealEntry } from '@/types/models'
import { createId } from '@/lib/utils'

const mealSchema = z.object({
  title: z.string().min(2),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  calories: z.coerce.number().min(0),
  protein: z.coerce.number().min(0),
  carbs: z.coerce.number().min(0),
  fats: z.coerce.number().min(0),
  notes: z.string().optional(),
})

type MealFormValues = z.output<typeof mealSchema>
type MealFormInput = z.input<typeof mealSchema>

export function NutritionPage() {
  const snapshot = useAppStore((state) => state.snapshot)
  const addMealEntry = useAppStore((state) => state.addMealEntry)
  const addWaterEntry = useAppStore((state) => state.addWaterEntry)
  const addSleepEntry = useAppStore((state) => state.addSleepEntry)
  const addWeightEntry = useAppStore((state) => state.addWeightEntry)
  const addMoodEntry = useAppStore((state) => state.addMoodEntry)
  const today = new Date().toISOString().slice(0, 10)
  const totals = getDailyMealTotals(snapshot.mealEntries, today)
  const waterTotal = getDailyWaterTotal(snapshot.waterEntries, today)
  const insight = buildNutritionInsight(totals.calories, snapshot.profile.dailyCalorieTarget, totals.protein, snapshot.profile.weightKg)

  const mealForm = useForm<MealFormInput, undefined, MealFormValues>({
    resolver: zodResolver(mealSchema),
    defaultValues: {
      title: '',
      mealType: 'breakfast',
      calories: 450,
      protein: 25,
      carbs: 40,
      fats: 14,
      notes: '',
    },
  })
  const mealType = useWatch({ control: mealForm.control, name: 'mealType' })

  async function submitMeal(values: MealFormValues) {
    const entry: MealEntry = {
      id: createId('meal'),
      date: today,
      mealType: values.mealType,
      title: values.title,
      calories: values.calories,
      protein: values.protein,
      carbs: values.carbs,
      fats: values.fats,
      notes: values.notes,
      updatedAt: new Date().toISOString(),
    }
    await addMealEntry(entry)
    mealForm.reset({ ...mealForm.getValues(), title: '', notes: '' })
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Nutrition and recovery"
        title="Meals, hydration, sleep, and wellness"
        description="Track the inputs that shape your output. Everything is logged locally first and remains available offline."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="space-y-2"><p className="text-sm text-muted-foreground">Calories today</p><p className="text-3xl font-semibold">{totals.calories}</p><p className="text-sm text-muted-foreground">Target {snapshot.profile.dailyCalorieTarget} kcal</p></CardContent></Card>
        <Card><CardContent className="space-y-2"><p className="text-sm text-muted-foreground">Protein</p><p className="text-3xl font-semibold">{totals.protein} g</p><p className="text-sm text-muted-foreground">Goal {Math.round(snapshot.profile.weightKg * 1.6)} g</p></CardContent></Card>
        <Card><CardContent className="space-y-2"><p className="text-sm text-muted-foreground">Hydration</p><p className="text-3xl font-semibold">{waterTotal} ml</p><p className="text-sm text-muted-foreground">Goal {snapshot.profile.waterGoalMl} ml</p></CardContent></Card>
        <Card><CardContent className="space-y-2"><p className="text-sm text-muted-foreground">Insight</p><p className="text-sm font-medium">{insight}</p></CardContent></Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Log a meal</CardTitle>
              <CardDescription>Capture calories, macros, and context for better daily targets and streak rewards.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={mealForm.handleSubmit(submitMeal)}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2"><p className="mb-2 text-sm font-semibold">Meal title</p><Input aria-label="Meal title" {...mealForm.register('title')} placeholder="Greek yogurt bowl with berries" /></div>
                <div>
                  <p className="mb-2 text-sm font-semibold">Meal type</p>
                  <Select value={mealType} onValueChange={(value) => mealForm.setValue('mealType', value as MealFormValues['mealType'])}>
                    <SelectTrigger aria-label="Meal type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast">Breakfast</SelectItem>
                      <SelectItem value="lunch">Lunch</SelectItem>
                      <SelectItem value="dinner">Dinner</SelectItem>
                      <SelectItem value="snack">Snack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><p className="mb-2 text-sm font-semibold">Calories</p><Input aria-label="Calories" type="number" {...mealForm.register('calories')} /></div>
                <div><p className="mb-2 text-sm font-semibold">Protein (g)</p><Input aria-label="Protein (g)" type="number" {...mealForm.register('protein')} /></div>
                <div><p className="mb-2 text-sm font-semibold">Carbs (g)</p><Input aria-label="Carbs (g)" type="number" {...mealForm.register('carbs')} /></div>
                <div><p className="mb-2 text-sm font-semibold">Fats (g)</p><Input aria-label="Fats (g)" type="number" {...mealForm.register('fats')} /></div>
                <div className="md:col-span-2"><p className="mb-2 text-sm font-semibold">Notes</p><Textarea aria-label="Notes" {...mealForm.register('notes')} placeholder="How you felt, satiety, prep notes, or timing." /></div>
              </div>
              <Button type="submit">Save meal</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Quick wellness actions</CardTitle>
                <CardDescription>Small daily inputs that fuel quests, analytics, and recovery scoring.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                {[250, 500, 750, 1000].map((amount) => (
                  <Button
                    key={amount}
                    variant="secondary"
                    onClick={() =>
                      void addWaterEntry({
                        id: createId('water'),
                        date: today,
                        amountMl: amount,
                        updatedAt: new Date().toISOString(),
                      })
                    }
                  >
                    <Droplets className="h-4 w-4" />
                    Add {amount} ml
                  </Button>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <Button variant="outline" onClick={() => void addSleepEntry({ id: createId('sleep'), date: today, durationHours: 7.5, quality: 4, updatedAt: new Date().toISOString() })}>
                  <MoonStar className="h-4 w-4" />
                  Log sleep
                </Button>
                <Button variant="outline" onClick={() => void addWeightEntry({ id: createId('weight'), date: today, weightKg: snapshot.profile.weightKg, updatedAt: new Date().toISOString() })}>
                  <Weight className="h-4 w-4" />
                  Log weight
                </Button>
                <Button variant="outline" onClick={() => void addMoodEntry({ id: createId('mood'), date: today, mood: 4, energy: 4, notes: 'Feeling steady and focused.', updatedAt: new Date().toISOString() })}>
                  <SmilePlus className="h-4 w-4" />
                  Log mood
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Today&apos;s log</CardTitle>
                <CardDescription>Nutrition, hydration, and recovery entries from today.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {snapshot.mealEntries.filter((entry) => entry.date === today).map((entry) => (
                <div key={entry.id} className="rounded-2xl bg-background/70 p-4 shadow-inset">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{entry.title}</p>
                      <p className="text-sm text-muted-foreground">{entry.mealType}</p>
                    </div>
                    <Badge variant="secondary">{entry.calories} kcal</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Protein {entry.protein}g | Carbs {entry.carbs}g | Fats {entry.fats}g</p>
                </div>
              ))}
              {snapshot.mealEntries.filter((entry) => entry.date === today).length === 0 ? (
                <div className="rounded-2xl bg-background/70 p-4 text-sm text-muted-foreground shadow-inset">
                  No meals logged yet today. Start with your next snack or meal.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

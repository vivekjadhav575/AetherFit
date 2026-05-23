import type { MealEntry, WaterEntry } from '@/types/models'

export function getDailyMealTotals(entries: MealEntry[], date: string) {
  return entries
    .filter((entry) => entry.date === date)
    .reduce(
      (totals, entry) => {
        totals.calories += entry.calories
        totals.protein += entry.protein
        totals.carbs += entry.carbs
        totals.fats += entry.fats
        return totals
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 },
    )
}

export function getDailyWaterTotal(entries: WaterEntry[], date: string) {
  return entries.filter((entry) => entry.date === date).reduce((sum, entry) => sum + entry.amountMl, 0)
}

export function buildNutritionInsight(calories: number, target: number, protein: number, weightKg: number) {
  if (calories < target * 0.75) return 'You are well below your calorie target. Consider adding a recovery snack or protein-rich dinner.'
  if (calories > target * 1.15) return 'Calories are trending above target today. Favor fiber, hydration, and a lighter final meal.'
  if (protein < weightKg * 1.4) return 'Protein intake is still low for recovery. Aim for another lean protein source before bed.'
  return 'Nutrition is aligned with your target today. Keep your meal timing steady and hydrate well.'
}

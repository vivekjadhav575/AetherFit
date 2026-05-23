import { describe, expect, it } from 'vitest'

import { buildNutritionInsight, getDailyMealTotals, getDailyWaterTotal } from '@/features/nutrition/nutrition-utils'

describe('nutrition utilities', () => {
  it('totals meal macros for a day', () => {
    const totals = getDailyMealTotals(
      [
        { id: '1', date: '2026-05-23', mealType: 'breakfast', title: 'A', calories: 300, protein: 20, carbs: 30, fats: 10, updatedAt: 'x' },
        { id: '2', date: '2026-05-23', mealType: 'lunch', title: 'B', calories: 500, protein: 35, carbs: 50, fats: 15, updatedAt: 'x' },
      ],
      '2026-05-23',
    )
    expect(totals.calories).toBe(800)
    expect(totals.protein).toBe(55)
  })

  it('totals hydration for a day', () => {
    expect(getDailyWaterTotal([{ id: 'w1', date: '2026-05-23', amountMl: 500, updatedAt: 'x' }], '2026-05-23')).toBe(500)
  })

  it('generates actionable nutrition insight', () => {
    expect(buildNutritionInsight(1200, 2200, 60, 70)).toContain('below your calorie target')
  })
})

import { expect, test } from '@playwright/test'

test('onboarding, dashboard, meal logging, dark mode, and persistence', async ({ page }) => {
  await page.goto('/onboarding')
  await page.getByLabel('Name').fill('Playwright User')
  await page.getByRole('button', { name: /start in guest mode/i }).click()
  await expect(page.getByText(/welcome back/i)).toBeVisible()
  await page.goto('/settings')
  await page.getByText(/theme mode/i).isVisible()
  await page.goto('/nutrition')
  await page.getByPlaceholder('Greek yogurt bowl with berries').fill('Test meal')
  await page.getByRole('button', { name: /save meal/i }).click()
  await expect(page.getByText('Test meal')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Test meal')).toBeVisible()
})

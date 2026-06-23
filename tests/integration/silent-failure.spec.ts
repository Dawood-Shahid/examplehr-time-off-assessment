import { test, expect } from '@playwright/test'

async function login(page: import('@playwright/test').Page, email: string) {
  await page.goto('/login', { waitUntil: 'networkidle' })
  await page.waitForSelector('#email', { timeout: 15000 })
  await page.fill('#email', email)
  await page.fill('#password', 'password')
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard', { timeout: 30000 })
}

async function resetHcmStore(page: import('@playwright/test').Page) {
  await page.evaluate(async () => {
    await fetch('/api/hcm/trigger/reset', { method: 'POST' })
  })
}

test.describe('Silent failure', () => {
  test('shows unconfirmed badge and restores balance after silent 201', async ({
    page,
  }) => {
    test.setTimeout(90_000)

    await login(page, 'alice@example.com')
    await resetHcmStore(page)
    await page.goto('/request-time-off')
    await page.selectOption('#location', 'NYC')

    await expect(page.getByText('12.0 Days').first()).toBeVisible({ timeout: 15000 })

    await page.fill('#startDate', '2024-12-01')
    await page.fill('#endDate', '2024-12-02')
    await page.click('button[type="submit"]')

    await expect(
      page.getByText(/pending manager approval|unconfirmed/i)
    ).toBeVisible({ timeout: 20000 })

    await expect(
      page.getByText(/unconfirmed.*re-verifying/i)
    ).toBeVisible({ timeout: 15000 })

    await expect(page.getByText('12.0 Days').first()).toBeVisible()
  })
})

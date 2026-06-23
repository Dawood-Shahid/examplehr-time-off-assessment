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

test.describe('Manager HCM Admin Controls', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'carol@example.com')
    await resetHcmStore(page)
    await page.goto('/approvals')
    await expect(page.getByText('HCM Admin Controls')).toBeVisible({ timeout: 15000 })
  })

  test('grants an anniversary bonus from the portal', async ({ page }) => {
    await page.getByLabel('Employee').selectOption('emp-1')
    await page.getByLabel('Location').selectOption('NYC')
    await page.getByRole('button', { name: /grant bonus/i }).click()

    await expect(page.getByText(/\+5 days granted/i)).toBeVisible({ timeout: 15000 })
  })

  test('runs a year-start reset from the portal', async ({ page }) => {
    const allocation = page.getByLabel(/allocation days/i)
    await allocation.fill('18')
    await page.getByRole('button', { name: /reset all to allocation/i }).click()

    await expect(page.getByText(/all balances set to 18 days/i)).toBeVisible({
      timeout: 15000,
    })
  })

  test('resets the store to seed from the portal', async ({ page }) => {
    await page.getByRole('button', { name: /reset store/i }).click()
    await expect(page.getByText(/store reset to seed data/i)).toBeVisible({
      timeout: 15000,
    })
  })
})

test.describe('Manager-triggered bonus reaches the employee', () => {
  test('employee dashboard surfaces a balance update after a manager grant', async ({
    browser,
  }) => {
    test.setTimeout(120_000)

    // Manager resets state, then employee loads their dashboard (captures the
    // pre-bonus balance so the next poll can detect the version bump).
    const managerContext = await browser.newContext()
    const managerPage = await managerContext.newPage()
    await login(managerPage, 'carol@example.com')
    await resetHcmStore(managerPage)
    await managerPage.goto('/approvals')
    await expect(managerPage.getByText('HCM Admin Controls')).toBeVisible({
      timeout: 15000,
    })

    const employeeContext = await browser.newContext()
    const employeePage = await employeeContext.newPage()
    await login(employeePage, 'alice@example.com')
    await employeePage.goto('/dashboard')
    await expect(employeePage.getByText('New York')).toBeVisible({ timeout: 15000 })

    // Manager grants a bonus to emp-1 / NYC through the portal UI.
    await managerPage.getByLabel('Employee').selectOption('emp-1')
    await managerPage.getByLabel('Location').selectOption('NYC')
    await managerPage.getByRole('button', { name: /grant bonus/i }).click()
    await expect(managerPage.getByText(/\+5 days granted/i)).toBeVisible({
      timeout: 15000,
    })

    // Employee's polling UI detects the out-of-band change.
    const nycCard = employeePage
      .locator('div')
      .filter({ hasText: 'New York' })
      .first()
    await expect(nycCard.getByText(/Balance updated/i)).toBeVisible({
      timeout: 20000,
    })

    await managerContext.close()
    await employeeContext.close()
  })
})

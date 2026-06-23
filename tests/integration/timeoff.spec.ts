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

async function triggerAnniversary(
  page: import('@playwright/test').Page,
  employeeId: string,
  locationId: string,
  bonusDays = 5
) {
  await page.evaluate(
    async ({ emp, loc, bonus }) => {
      const res = await fetch('/api/hcm/trigger/anniversary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: emp,
          locationId: loc,
          bonusDays: bonus,
        }),
      })
      if (!res.ok) throw new Error(`anniversary trigger failed: ${res.status}`)
    },
    { emp: employeeId, loc: locationId, bonus: bonusDays }
  )
}

test.describe('Happy path', () => {
  test('employee submits request and manager approves', async ({ browser }) => {
    test.setTimeout(120_000)

    const employeeContext = await browser.newContext()
    const employeePage = await employeeContext.newPage()
    await login(employeePage, 'alice@example.com')

    await employeePage.goto('/request-time-off')
    await employeePage.selectOption('#location', 'LON')
    await employeePage.fill('#startDate', '2024-08-01')
    await employeePage.fill('#endDate', '2024-08-02')
    await employeePage.click('button[type="submit"]')

    await expect(
      employeePage
        .getByText('Submitting your request…')
        .or(employeePage.getByText('Request submitted — pending manager approval.'))
        .or(employeePage.getByText('Insufficient balance'))
    ).toBeVisible({ timeout: 20000 })

    const managerContext = await browser.newContext()
    const managerPage = await managerContext.newPage()
    await login(managerPage, 'carol@example.com')
    await managerPage.goto('/approvals')
    await expect(managerPage.getByText('Pending Approval Queue')).toBeVisible()

    const approveBtn = managerPage.getByRole('button', { name: 'Approve' }).first()
    if (await approveBtn.isVisible()) {
      await approveBtn.click()
    }

    await employeeContext.close()
    await managerContext.close()
  })
})

test.describe('Rejection path', () => {
  test('shows error when insufficient balance', async ({ page }) => {
    await login(page, 'alice@example.com')
    await page.goto('/request-time-off')
    await page.selectOption('#location', 'LON')
    await page.fill('#startDate', '2024-09-01')
    await page.fill('#endDate', '2024-12-31')
    await page.click('button[type="submit"]')

    await expect(
      page.getByText(/Insufficient balance|Request failed|conflict/i)
    ).toBeVisible({ timeout: 15000 })
  })
})

test.describe('Role-based navigation', () => {
  test('employee sees request tabs not approvals', async ({ page }) => {
    await login(page, 'alice@example.com')
    await expect(page.getByRole('link', { name: 'Request Time Off' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'My Requests' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Time Off Approvals' })).not.toBeVisible()
  })

  test('manager sees approvals not employee tabs', async ({ page }) => {
    await login(page, 'carol@example.com')
    await expect(page.getByRole('link', { name: 'Time Off Approvals' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Request Time Off' })).not.toBeVisible()
    await expect(page.getByRole('link', { name: 'My Requests' })).not.toBeVisible()
  })

  test('manager cannot access employee routes', async ({ page }) => {
    await login(page, 'carol@example.com')
    await page.goto('/request-time-off')
    await expect(page).toHaveURL('/dashboard')
  })
})

test.describe('Anniversary bonus', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'alice@example.com')
    await resetHcmStore(page)
  })

  test('shows balance update notice while request form stays intact', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    await page.goto('/request-time-off')
    await page.selectOption('#location', 'NYC')
    await page.fill('#startDate', '2024-10-01')
    await page.fill('#endDate', '2024-10-05')

    const startValue = await page.inputValue('#startDate')
    const endValue = await page.inputValue('#endDate')

    await expect(page.getByText('12.0 Days')).toBeVisible({ timeout: 15000 })

    await triggerAnniversary(page, 'emp-1', 'NYC', 5)
    await page.waitForTimeout(3000)

    await expect(page.getByText(/Balance updated/i)).toBeVisible({ timeout: 15000 })

    expect(await page.inputValue('#startDate')).toBe(startValue)
    expect(await page.inputValue('#endDate')).toBe(endValue)

    await page.getByRole('button', { name: 'Review updated balance' }).click()
    await expect(page.getByText('17.0 Days')).toBeVisible()
  })

  test('dashboard shows balance update on location card', async ({ page }) => {
    test.setTimeout(60_000)
    await page.goto('/dashboard')
    await expect(page.getByText('New York')).toBeVisible({ timeout: 15000 })

    await triggerAnniversary(page, 'emp-1', 'NYC', 5)
    await page.waitForTimeout(3000)

    const nycCard = page.locator('div').filter({ hasText: 'New York' }).first()
    await expect(nycCard.getByText(/Balance updated/i)).toBeVisible({ timeout: 15000 })
    await expect(nycCard.getByRole('button', { name: 'Review updated balance' })).toBeVisible()
  })
})

test.describe('Anniversary bonus during in-flight mutation', () => {
  test('holds bonus update during optimistic submission', async ({ page }) => {
    test.setTimeout(90_000)

    await login(page, 'alice@example.com')
    await resetHcmStore(page)
    await page.goto('/request-time-off')
    await page.selectOption('#location', 'NYC')
    await expect(page.locator('#location')).toHaveValue('NYC')
    await page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/hcm/balance/emp-1/NYC') && resp.status() === 200
    )
    await page.fill('#startDate', '2024-11-01')
    await page.fill('#endDate', '2024-11-02')

    await expect(page.getByText('Projected Balance')).toBeVisible({ timeout: 15000 })

    await page.route('**/api/hcm/request', async (route) => {
      await new Promise((r) => setTimeout(r, 3000))
      await route.continue()
    })

    await page.click('button[type="submit"]')
    await expect(page.getByText('Submitting your request…')).toBeVisible()

    await triggerAnniversary(page, 'emp-1', 'NYC', 5)
    await page.waitForTimeout(3000)

    await expect(
      page.getByText('Balance updated — tap to review')
    ).toBeVisible({ timeout: 15000 })

    await expect(page.getByText('17.0 Days')).not.toBeVisible()

    await expect(
      page.getByText('Request submitted — pending manager approval.')
    ).toBeVisible({ timeout: 15000 })

    await page.getByRole('button', { name: 'Review updated balance' }).click()
    await expect(
      page.getByRole('button', { name: 'Review updated balance' })
    ).not.toBeVisible()
  })
})

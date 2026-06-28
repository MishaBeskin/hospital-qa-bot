import { test, expect, type Page } from '@playwright/test'

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? ''
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? ''

async function login(page: Page) {
  await page.goto('/admin/login')
  await page.locator('#email').fill(ADMIN_EMAIL)
  await page.locator('#password').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'כניסה' }).click()
  await page.waitForURL('/admin/qa')
}

test.describe('admin login', () => {
  test('shows error for wrong credentials', async ({ page }) => {
    await page.goto('/admin/login')
    await page.locator('#email').fill('wrong@example.com')
    await page.locator('#password').fill('wrongpassword123')
    await page.getByRole('button', { name: 'כניסה' }).click()
    await expect(page.getByText('כתובת אימייל או סיסמה שגויים')).toBeVisible({ timeout: 10_000 })
  })

  test('redirects to /admin/qa on successful login', async ({ page }) => {
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) test.skip()
    await login(page)
    await expect(page).toHaveURL('/admin/qa')
    await expect(page.getByRole('heading', { name: 'שאלות ותשובות' })).toBeVisible()
  })
})

test.describe('admin Q&A CRUD', () => {
  test.beforeEach(async ({ page }) => {
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      test.skip()
      return
    }
    await login(page)
  })

  test('create a Q&A pair and confirm it appears in the table', async ({ page }) => {
    const ts = Date.now()
    const question = `שאלת בדיקה E2E ${ts}`
    const answer = `תשובת בדיקה E2E ${ts}`

    await page.getByRole('link', { name: 'שאלה חדשה' }).click()
    await page.waitForURL('/admin/qa/new')

    await page.locator('#question').fill(question)
    await page.locator('#answer').fill(answer)
    await page.getByRole('button', { name: 'צור שאלה' }).click()
    await page.waitForURL('/admin/qa')

    await expect(page.getByText(question)).toBeVisible()

    // Cleanup — delete the row we just created
    const row = page.locator('tr').filter({ hasText: question })
    await row.getByLabel('מחק').click()
    await page.getByRole('dialog').getByRole('button', { name: 'מחק' }).click()
    await expect(page.getByText(question)).not.toBeVisible({ timeout: 5_000 })
  })

  test('edit a Q&A pair and confirm the updated question appears', async ({ page }) => {
    const ts = Date.now()
    const question = `שאלת עריכה E2E ${ts}`
    const answer = `תשובת עריכה E2E ${ts}`
    const updatedQuestion = `שאלת עריכה E2E מעודכנת ${ts}`

    // Create
    await page.getByRole('link', { name: 'שאלה חדשה' }).click()
    await page.locator('#question').fill(question)
    await page.locator('#answer').fill(answer)
    await page.getByRole('button', { name: 'צור שאלה' }).click()
    await page.waitForURL('/admin/qa')

    // Edit
    const row = page.locator('tr').filter({ hasText: question })
    await row.getByLabel('ערוך').click()
    await page.waitForURL(/\/admin\/qa\/.+\/edit/)
    await page.locator('#question').clear()
    await page.locator('#question').fill(updatedQuestion)
    await page.getByRole('button', { name: 'עדכן שאלה' }).click()
    await page.waitForURL('/admin/qa')

    await expect(page.getByText(updatedQuestion)).toBeVisible()

    // Cleanup
    const updatedRow = page.locator('tr').filter({ hasText: updatedQuestion })
    await updatedRow.getByLabel('מחק').click()
    await page.getByRole('dialog').getByRole('button', { name: 'מחק' }).click()
    await expect(page.getByText(updatedQuestion)).not.toBeVisible({ timeout: 5_000 })
  })

  test('delete a Q&A pair via the confirm dialog', async ({ page }) => {
    const ts = Date.now()
    const question = `שאלת מחיקה E2E ${ts}`

    // Create
    await page.getByRole('link', { name: 'שאלה חדשה' }).click()
    await page.locator('#question').fill(question)
    await page.locator('#answer').fill(`תשובת מחיקה E2E ${ts}`)
    await page.getByRole('button', { name: 'צור שאלה' }).click()
    await page.waitForURL('/admin/qa')
    await expect(page.getByText(question)).toBeVisible()

    // Delete
    const row = page.locator('tr').filter({ hasText: question })
    await row.getByLabel('מחק').click()

    // Confirm dialog is visible
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('פעולה זו אינה ניתנת לביטול')).toBeVisible()

    // Confirm deletion
    await page.getByRole('dialog').getByRole('button', { name: 'מחק' }).click()
    await expect(page.getByText(question)).not.toBeVisible({ timeout: 5_000 })
  })

  test('cancel delete keeps the Q&A in the table', async ({ page }) => {
    const ts = Date.now()
    const question = `שאלת ביטול מחיקה E2E ${ts}`

    // Create
    await page.getByRole('link', { name: 'שאלה חדשה' }).click()
    await page.locator('#question').fill(question)
    await page.locator('#answer').fill(`תשובת ביטול מחיקה E2E ${ts}`)
    await page.getByRole('button', { name: 'צור שאלה' }).click()
    await page.waitForURL('/admin/qa')

    // Attempt delete, then cancel
    const row = page.locator('tr').filter({ hasText: question })
    await row.getByLabel('מחק').click()
    await page.getByRole('dialog').getByRole('button', { name: 'ביטול' }).click()
    await expect(page.getByText(question)).toBeVisible()

    // Cleanup
    const row2 = page.locator('tr').filter({ hasText: question })
    await row2.getByLabel('מחק').click()
    await page.getByRole('dialog').getByRole('button', { name: 'מחק' }).click()
    await expect(page.getByText(question)).not.toBeVisible({ timeout: 5_000 })
  })
})

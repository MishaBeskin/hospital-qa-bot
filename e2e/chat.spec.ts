import { test, expect } from '@playwright/test'

const FALLBACK = 'לא נמצא מידע מאושר בנושא זה. אנא פנה למחלקת משאבי אנוש.'

test.describe('chat screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the chat interface', async ({ page }) => {
    await expect(page.getByPlaceholder('כתוב את שאלתך כאן...')).toBeVisible()
    await expect(page.getByLabel('שלח הודעה')).toBeVisible()
  })

  test('send button is disabled when input is empty', async ({ page }) => {
    await expect(page.getByLabel('שלח הודעה')).toBeDisabled()
  })

  test('send button enables when user types', async ({ page }) => {
    await page.getByPlaceholder('כתוב את שאלתך כאן...').fill('שאלה')
    await expect(page.getByLabel('שלח הודעה')).toBeEnabled()
  })

  test('user message appears in chat after sending', async ({ page }) => {
    const question = 'מה שעות העבודה בבית החולים?'
    await page.getByPlaceholder('כתוב את שאלתך כאן...').fill(question)
    await page.getByLabel('שלח הודעה').click()
    await expect(page.getByText(question)).toBeVisible()
  })

  test('nonsense question returns the fallback answer', async ({ page }) => {
    await page.getByPlaceholder('כתוב את שאלתך כאן...').fill(
      'xyzzy nonsense 99999 random שאלה שלא קיימת בכלל',
    )
    await page.getByLabel('שלח הודעה').click()
    await expect(page.getByText(FALLBACK)).toBeVisible({ timeout: 20_000 })
  })

  test('input clears after sending', async ({ page }) => {
    const input = page.getByPlaceholder('כתוב את שאלתך כאן...')
    await input.fill('שאלה לניקוי')
    await page.getByLabel('שלח הודעה').click()
    await expect(input).toHaveValue('')
  })
})

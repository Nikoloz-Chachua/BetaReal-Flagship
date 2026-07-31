import { expect, test } from '@playwright/test'

test('captures representative art direction screenshots', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 920 })
  await page.goto('/?lang=en')
  await expect(page.getByRole('heading', { name: 'YOUR MENU, BEYOND THE SCREEN.' })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('desktop-first-fold.png'), fullPage: false })

  for (const id of ['luxury-dining', 'modern-cafe', 'premium-fast-casual', 'social-dining', 'contact']) {
    await page.locator(`#${id}`).evaluate((element) => element.scrollIntoView({ block: 'start', behavior: 'instant' }))
    await page.waitForTimeout(120)
    await page.screenshot({ path: testInfo.outputPath(`desktop-${id}.png`), fullPage: false })
  }

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?lang=en')
  await page.screenshot({ path: testInfo.outputPath('mobile-first-fold.png'), fullPage: false })
  for (const id of ['luxury-dining', 'modern-cafe', 'premium-fast-casual', 'social-dining', 'contact']) {
    await page.locator(`#${id}`).evaluate((element) => element.scrollIntoView({ block: 'start', behavior: 'instant' }))
    await page.waitForTimeout(120)
    await page.screenshot({ path: testInfo.outputPath(`mobile-${id}.png`), fullPage: false })
  }
})

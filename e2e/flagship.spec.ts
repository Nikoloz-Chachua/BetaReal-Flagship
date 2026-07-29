import { expect, test } from '@playwright/test'

declare global {
  interface Window {
    __analyticsEvents: Array<Record<string, string | undefined>>
  }
}

test('deep links, navigation, lazy model loading, drawer, modal, and blocked form fallback work', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  await page.addInitScript(() => {
    window.open = () => null
  })

  await page.goto('/?segment=cafe&restaurant=Demo%20Bistro&utm_source=qa&utm_campaign=smoke')
  await expect(page.getByRole('heading', { name: 'YOUR MENU, BEYOND THE SCREEN.' })).toBeVisible()
  await expect(page.getByText('Demo Bistro')).toBeVisible()
  await expect(page.locator('script[data-betareal-model-viewer]')).toHaveCount(0)

  await page.getByRole('navigation', { name: 'Restaurant experiences' }).getByRole('link', { name: 'Fast Casual', exact: true }).click()
  await expect(page.locator('#premium-fast-casual')).toBeInViewport()

  await page.getByRole('button', { name: /View a Dish in 3D/ }).click()
  const modelDialog = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'BigBurger' }) })
  await expect(modelDialog).toBeVisible()
  await expect(page.locator('script[data-betareal-model-viewer]')).toHaveCount(1)
  await page.keyboard.press('Escape')
  await expect(modelDialog).toBeHidden()

  const menuButton = page.getByRole('button', { name: 'Open menu' })
  if (await menuButton.isVisible()) {
    await menuButton.click()
    await expect(page.getByRole('dialog', { name: 'Mobile navigation' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Mobile navigation' })).toBeHidden()
  }

  await page.locator('#contact').scrollIntoViewIfNeeded()
  await page.getByLabel('Restaurant name').fill('Demo Bistro')
  await page.getByLabel('Contact person').fill('Nino')
  await page.getByLabel('Phone or email').fill('+995 555 000 000')
  await page.getByLabel('Restaurant category').selectOption('cafe')
  await page.getByLabel('I agree to contact BetaReal about this request.').check()
  await page.getByRole('button', { name: 'Prepare WhatsApp message' }).click()
  await expect(page.getByRole('status')).toContainText('WhatsApp did not open automatically')
  await expect(page.getByRole('link', { name: 'Open prepared WhatsApp message' })).toHaveAttribute('href', /https:\/\/wa\.me\/995593191707/)
  expect(consoleErrors).toEqual([])
})

test('lead form opens a real prepared WhatsApp popup and preserves spaced multiline input', async ({ page, context }) => {
  await context.route('https://wa.me/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>WhatsApp prepared</title>' }),
  )
  await page.goto('/')
  await page.locator('#contact').scrollIntoViewIfNeeded()
  const pageCountBefore = context.pages().length
  await page.getByLabel('Restaurant name').fill('Demo Bistro')
  await page.getByLabel('Contact person').fill('ნინო გიორგაძე')
  await page.getByLabel('Phone or email').fill('+995 555 000 000')
  await page.getByLabel('Restaurant category').selectOption('cafe')
  await page.getByLabel('Optional message').fill('Need more details\nSecond line with spaces')
  await page.getByLabel('I agree to contact BetaReal about this request.').check()
  const popupPromise = page.waitForEvent('popup')
  await page.getByRole('button', { name: 'Prepare WhatsApp message' }).click()
  const popup = await popupPromise
  await popup.waitForURL(/https:\/\/wa\.me\/995593191707/)
  expect(context.pages().length).toBe(pageCountBefore + 1)
  expect(popup.url()).toContain('https://wa.me/995593191707')
  const decodedMessage = new URL(popup.url()).searchParams.get('text') ?? ''
  expect(decodedMessage).toContain('Restaurant: Demo Bistro')
  expect(decodedMessage).toContain('Contact person: ნინო გიორგაძე')
  expect(decodedMessage).toContain('Message: Need more details\nSecond line with spaces')
  await expect(page.getByLabel('Restaurant name')).toHaveValue('Demo Bistro')
  await expect(page.getByLabel('Optional message')).toHaveValue('Need more details\nSecond line with spaces')
  await expect(page.getByRole('status')).toContainText('prepared WhatsApp conversation opened')
  expect(await popup.evaluate(() => window.opener)).toBeNull()
})

test('query segment deep link emits cafe as the initial section analytics event', async ({ page }) => {
  await page.addInitScript(() => {
    window.__analyticsEvents = []
    window.addEventListener('betareal:analytics', (event) => {
      window.__analyticsEvents.push((event as CustomEvent).detail)
    })
  })
  await page.goto('/?segment=cafe&restaurant=Demo%20Bistro&utm_source=qa&utm_campaign=smoke')
  await page.waitForFunction(() => window.__analyticsEvents.some((event) => event.event === 'experience_section_viewed'))
  const sectionViews = await page.evaluate(() => window.__analyticsEvents.filter((event) => event.event === 'experience_section_viewed'))
  expect(sectionViews[0]).toMatchObject({ segment: 'cafe', source: 'qa', campaign: 'smoke' })
  expect(sectionViews.filter((event) => event.segment === 'luxury')).toHaveLength(0)
})

test('responsive layouts avoid horizontal overflow and keep headings visible', async ({ page }) => {
  for (const size of [
    { width: 320, height: 720 },
    { width: 390, height: 844 },
    { width: 768, height: 900 },
    { width: 1024, height: 768 },
    { width: 1440, height: 920 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(size)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'YOUR MENU, BEYOND THE SCREEN.' })).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(overflow, `overflow at ${size.width}`).toBe(false)
    const headingIssues = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll<HTMLHeadingElement>('#main h1, #main h2'))
      return headings.flatMap((heading) => {
        const style = getComputedStyle(heading)
        const rect = heading.getBoundingClientRect()
        const issues: string[] = []
        if (heading.scrollWidth > heading.clientWidth + 1) issues.push(`${heading.textContent} overflows`)
        if (rect.left < -1 || rect.right > window.innerWidth + 1) issues.push(`${heading.textContent} escapes viewport`)
        if (style.overflowWrap === 'anywhere' || style.wordBreak === 'break-all' || style.hyphens === 'auto') {
          issues.push(`${heading.textContent} allows arbitrary word breaks`)
        }
        const textNode = Array.from(heading.childNodes).find((node): node is Text => node.nodeType === Node.TEXT_NODE)
        const text = textNode?.textContent ?? ''
        if (!textNode) return issues
        for (const match of text.matchAll(/[A-Za-z]{4,}/g)) {
          const range = document.createRange()
          range.setStart(textNode, match.index ?? 0)
          range.setEnd(textNode, (match.index ?? 0) + match[0].length)
          const lines = Array.from(range.getClientRects()).filter((line) => line.width > 1)
          if (lines.length > 1) issues.push(`${heading.textContent} splits ${match[0]}`)
        }
        return issues
      })
    })
    expect(headingIssues, `heading wrapping at ${size.width}`).toEqual([])
  }
})

test('mobile chapter demo follows story and unavailable model controls are absent', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.locator('#modern-cafe').evaluate((element) => element.scrollIntoView({ block: 'start', behavior: 'instant' }))
  await expect(page.getByTestId('modern-cafe-demo')).toBeVisible()
  const flow = await page.evaluate(() => {
    const story = document.querySelector('[data-testid="modern-cafe-story"]')?.getBoundingClientRect()
    const demo = document.querySelector('[data-testid="modern-cafe-demo"]')?.getBoundingClientRect()
    const media = document.querySelector('[data-testid="modern-cafe-media"]')
    if (!story || !demo || !media) return null
    return {
      storyBottom: story.bottom,
      demoTop: demo.top,
      mediaDisplay: getComputedStyle(media).display,
    }
  })
  expect(flow).not.toBeNull()
  expect(flow!.demoTop).toBeGreaterThanOrEqual(flow!.storyBottom - 1)
  expect(flow!.demoTop - flow!.storyBottom).toBeLessThan(28)
  expect(flow!.mediaDisplay).toBe('none')
  await expect(page.locator('#modern-cafe article button:disabled')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'View in 3D: Chia Fruit Bowl' })).toHaveCount(0)
  await expect(page.getByTestId('modern-cafe-demo').getByRole('button', { name: 'View in 3D: Chocolate Croissant' })).toBeVisible()
})

test('experience navigation active state follows nearest chapter at mobile and desktop', async ({ page }) => {
  for (const size of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(size)
    await page.goto('/')
    for (const chapter of [
      ['luxury-dining', 'Luxury'],
      ['modern-cafe', 'Modern Café'],
      ['premium-fast-casual', 'Fast Casual'],
      ['social-dining', 'Social Dining'],
    ] as const) {
      await page.locator(`#${chapter[0]}`).evaluate((element) => element.scrollIntoView({ block: 'start', behavior: 'instant' }))
      await expect(
        page.getByRole('navigation', { name: 'Restaurant experiences' }).getByRole('link', { name: chapter[1], exact: true }),
        `${chapter[1]} active at ${size.width}`,
      ).toHaveAttribute('aria-current', 'true')
    }
  }
})

test('reduced motion still exposes primary content', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/demo/social-dining')
  await expect(page.locator('#social-dining')).toBeInViewport()
  await expect(page.getByRole('heading', { name: 'Built for Busy Places.' })).toBeVisible()
})

test('technology tabs, Georgian names, unknown route, and AR loader failure fallback behave in browser', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })

  await page.addInitScript(() => {
    const appendChild = Node.prototype.appendChild
    Node.prototype.appendChild = function (this: Node, node: Node) {
      if (node instanceof HTMLScriptElement && node.src.includes('model-viewer.min.js')) {
        window.setTimeout(() => node.dispatchEvent(new Event('error')), 0)
        return node
      }
      return appendChild.call(this, node)
    } as typeof Node.prototype.appendChild
  })

  await page.goto('/unknown?lang=ka')
  await expect(page.getByRole('heading', { name: 'გვერდი ვერ მოიძებნა' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'BetaReal-ის მთავარ გვერდზე გადასვლა' })).toBeVisible()
  await expect(page).toHaveURL(/\/unknown\?lang=ka$/)

  await page.goto('/?restaurant=Demo%20Bistro')
  const tablist = page.getByRole('tablist', { name: 'Technology states' })
  await tablist.getByRole('tab', { name: 'Menu View' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(tablist.getByRole('tab', { name: 'Interactive 3D' })).toBeFocused()
  await page.keyboard.press('End')
  await expect(tablist.getByRole('tab', { name: 'Augmented Reality' })).toBeFocused()
  await expect(page.getByRole('button', { name: 'View on table' })).toBeVisible()
  const tabRelationships = await page.evaluate(() => {
    return Array.from(document.querySelectorAll<HTMLElement>('[role="tab"]')).map((tab) => {
      const panelId = tab.getAttribute('aria-controls')
      const panel = panelId ? document.getElementById(panelId) : null
      return {
        tabId: tab.id,
        panelId,
        panelExists: Boolean(panel),
        labelledBy: panel?.getAttribute('aria-labelledby') ?? null,
      }
    })
  })
  expect(tabRelationships).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ tabId: 'technology-tab-menu', panelId: 'technology-panel-menu', panelExists: true, labelledBy: 'technology-tab-menu' }),
      expect.objectContaining({ tabId: 'technology-tab-model', panelId: 'technology-panel-model', panelExists: true, labelledBy: 'technology-tab-model' }),
      expect.objectContaining({ tabId: 'technology-tab-ar', panelId: 'technology-panel-ar', panelExists: true, labelledBy: 'technology-tab-ar' }),
    ]),
  )

  await page.getByRole('button', { name: 'View on table' }).click()
  const arDialog = page.getByRole('dialog')
  await expect(arDialog).toBeVisible()
  await expect(page.getByText("AR isn't available here, so the interactive 3D view is open.").first()).toBeVisible()
  await expect(arDialog.getByRole('button', { name: 'Retry 3D viewer' })).toBeVisible()
  await expect(arDialog.getByRole('link', { name: 'Open Full Demo', exact: true })).toBeVisible()
  await expect(arDialog.getByRole('img', { name: 'BigBurger' })).toBeVisible()
  await page.keyboard.press('Escape')

  const kaButton = page.getByRole('button', { name: 'KA' })
  if (await kaButton.isVisible()) {
    await kaButton.click()
  } else {
    await page.getByRole('button', { name: 'Open menu' }).click()
    await page.getByRole('dialog', { name: 'Mobile navigation' }).getByRole('button', { name: 'ქართული' }).click()
    await page.keyboard.press('Escape')
  }
  const georgianMenu = page.getByRole('button', { name: 'მენიუს გახსნა' })
  if (await georgianMenu.isVisible()) {
    await georgianMenu.click()
    await expect(page.getByRole('dialog', { name: 'მობილური ნავიგაცია' })).toBeVisible()
    await page.keyboard.press('Escape')
  } else {
    await expect(page.getByRole('navigation', { name: 'ძირითადი ნავიგაცია' })).toBeVisible()
  }
  await expect(page.getByRole('tablist', { name: 'ტექნოლოგიის მდგომარეობები' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'გაფართოებული რეალობა' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'მაგიდაზე ნახვა' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'AR-ში განთავსება: შოკოლადის კრუასანი' }).first()).toBeVisible()
  await page.locator('#contact').scrollIntoViewIfNeeded()
  await expect(page.getByLabel('რესტორნის კატეგორია').getByRole('option', { name: 'აირჩიეთ' })).toHaveCount(1)
  await expect(page.getByRole('complementary', { name: 'პერსონალიზებული პრევიუ' })).toBeVisible()
  expect(consoleErrors).toEqual([])
})

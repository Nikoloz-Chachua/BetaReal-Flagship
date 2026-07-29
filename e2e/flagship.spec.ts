import { expect, test, type Page } from '@playwright/test'

const MODEL_VIEWER_MAX_CAMERA_ORBIT = 'auto 70deg auto'
const MODEL_VIEWER_MAX_POLAR_DEG = 70

declare global {
  interface Window {
    __analyticsEvents: Array<Record<string, string | undefined>>
  }
}

async function installModelViewerStub(page: Page, options: { failScript?: boolean; autoLoad?: boolean } = {}) {
  await page.route('https://ajax.googleapis.com/ajax/libs/model-viewer/**', (route) => {
    if (options.failScript) {
      void route.abort()
      return
    }
    const body = `
      if (!window.customElements.get('model-viewer')) {
        window.customElements.define('model-viewer', class extends HTMLElement {
          theta = 20;
          phi = 66;
          radius = 96;
          activateAR = async () => undefined;
          maxPhiDeg() {
            const parts = (this.getAttribute('max-camera-orbit') || '').trim().split(/\\s+/);
            const phi = Number.parseFloat(parts[1] || '');
            return Number.isFinite(phi) ? phi : 180;
          }
          getCameraOrbit() {
            return { theta: this.theta + 'deg', phi: this.phi + 'deg', radius: this.radius + '%' };
          }
          connectedCallback() {
            this.addEventListener('pointermove', () => {
              this.theta += 12;
              this.phi = Math.min(this.maxPhiDeg(), this.phi + 80);
            });
            this.addEventListener('wheel', (event) => {
              event.preventDefault();
              this.radius = Math.max(45, this.radius + (event.deltaY > 0 ? 8 : -8));
            });
            if (${options.autoLoad !== false}) {
              window.setTimeout(() => this.dispatchEvent(new Event('load')), 0);
            }
          }
        });
      }
    `
    void route.fulfill({ status: 200, contentType: 'text/javascript', body })
  })
}

test('deep links, navigation, lazy model loading, drawer, modal, and blocked form fallback work', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  await installModelViewerStub(page)
  await page.addInitScript(() => {
    window.open = () => null
  })

  await page.goto('/?restaurant=Demo%20Bistro&utm_source=qa&utm_campaign=smoke')
  await expect(page.getByRole('heading', { name: 'YOUR MENU, BEYOND THE SCREEN.' })).toBeVisible()
  await expect(page.getByText('Demo Bistro')).toBeVisible()
  await expect(page.locator('script[data-betareal-model-viewer]')).toHaveCount(1)
  await expect(page.getByTestId('inline-model-hero-bigburger')).toHaveAttribute('data-inline-model-state', 'ready')

  await page.getByRole('navigation', { name: 'Restaurant experiences' }).getByRole('link', { name: 'Fast Casual', exact: true }).click()
  await expect(page.locator('#premium-fast-casual')).toBeInViewport()
  await page.waitForTimeout(180)
  await page.getByTestId('inline-model-fast-bigburger').evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await expect(page.locator('script[data-betareal-model-viewer]')).toHaveCount(1)
  await expect(page.getByTestId('inline-model-fast-bigburger')).toHaveAttribute('data-inline-model-state', 'ready')

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

test('chapter tiers have distinct backgrounds, surfaces, and readable story contrast', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 920 })
  await page.goto('/')
  const tiers = await page.evaluate(() => {
    function rgbParts(value: string) {
      if (value.startsWith('#')) {
        const hex = value.slice(1)
        const full = hex.length === 3 ? hex.split('').map((part) => part + part).join('') : hex
        return [0, 2, 4].map((start) => Number.parseInt(full.slice(start, start + 2), 16))
      }
      const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
      return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : [0, 0, 0]
    }
    function luminance(rgb: number[]) {
      const [r, g, b] = rgb.map((channel) => {
        const normalized = channel / 255
        return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    function contrast(a: string, b: string) {
      const first = luminance(rgbParts(a))
      const second = luminance(rgbParts(b))
      return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
    }
    const cafeReference = {
      bg: 'rgb(54, 161, 176)',
      ink: 'rgb(11, 42, 48)',
      accent: 'rgb(8, 145, 178)',
      accentStrong: 'rgb(14, 116, 144)',
      stage: 'rgb(120, 186, 196)',
      pill: 'rgba(255, 255, 255, 0.86)',
      border: 'rgba(6, 120, 150, 0.2)',
    }
    return ['luxury-dining', 'modern-cafe', 'premium-fast-casual', 'social-dining'].map((id) => {
      const chapter = document.getElementById(id)
      const preview = chapter?.querySelector<HTMLElement>('[data-layout]')
      const story = chapter?.querySelector<HTMLElement>('[data-testid$="-story"]')
      if (!chapter || !preview || !story) return null
      const chapterStyle = getComputedStyle(chapter)
      const previewStyle = getComputedStyle(preview)
      const storyStyle = getComputedStyle(story)
      const chapterBg = chapterStyle.getPropertyValue('--chapter-bg').trim() || chapterStyle.backgroundColor
      const firstCard = preview.querySelector<HTMLElement>('article')
      const firstCardTitle = firstCard?.querySelector<HTMLElement>('h3')
      const firstCardBody = firstCard?.querySelector<HTMLElement>('h3 + p')
      const inactivePill = preview.querySelector<HTMLElement>('[aria-label="Preview categories"] button:not([aria-pressed="true"])')
      const activePill = preview.querySelector<HTMLElement>('[aria-label="Preview categories"] button[aria-pressed="true"]')
      const stage = preview.querySelector<HTMLElement>('[data-testid="inline-model-cafe-croissant"]')
      const primaryAction = preview.querySelector<HTMLElement>('article button[aria-label^="View in 3D"]')
      return {
        id,
        chapterBackgroundColor: chapterStyle.backgroundColor,
        chapterBg: chapterStyle.backgroundImage + chapterStyle.backgroundColor,
        surface: previewStyle.backgroundImage + previewStyle.backgroundColor,
        previewBorderColor: previewStyle.borderColor,
        borderRadius: previewStyle.borderRadius,
        storyContrast: contrast(storyStyle.color, chapterBg),
        storyColor: storyStyle.color,
        cafe: id === 'modern-cafe' && firstCard && firstCardTitle && firstCardBody && inactivePill && activePill && stage && primaryAction
          ? {
              bodyColor: getComputedStyle(story.querySelector<HTMLElement>('p:nth-of-type(2)') ?? story).color,
              previewBackgroundImage: previewStyle.backgroundImage,
              previewBorderColor: previewStyle.borderColor,
              cardBackgroundImage: getComputedStyle(firstCard).backgroundImage,
              cardBorderColor: getComputedStyle(firstCard).borderColor,
              cardTitleColor: getComputedStyle(firstCardTitle).color,
              cardBodyColor: getComputedStyle(firstCardBody).color,
              inactivePillBackground: getComputedStyle(inactivePill).backgroundColor,
              inactivePillColor: getComputedStyle(inactivePill).color,
              activePillBackground: getComputedStyle(activePill).backgroundImage,
              activePillColor: getComputedStyle(activePill).color,
              stageBackground: getComputedStyle(stage).backgroundColor,
              primaryActionBackground: getComputedStyle(primaryAction).backgroundImage,
              primaryActionColor: getComputedStyle(primaryAction).color,
              textOnChapterContrast: contrast(cafeReference.ink, cafeReference.bg),
              textOnCardContrast: Math.min(contrast(cafeReference.ink, 'rgb(255, 255, 255)'), contrast(cafeReference.ink, 'rgb(230, 251, 255)')),
              pillContrast: contrast(cafeReference.ink, 'rgb(255, 255, 255)'),
              activePillContrast: Math.min(contrast('rgb(255, 255, 255)', cafeReference.accent), contrast('rgb(255, 255, 255)', cafeReference.accentStrong)),
            }
          : null,
      }
    })
  })
  expect(tiers.every(Boolean)).toBe(true)
  expect(new Set(tiers.map((tier) => tier?.chapterBg)).size).toBe(4)
  expect(new Set(tiers.map((tier) => tier?.surface)).size).toBe(4)
  for (const tier of tiers) {
    expect(tier!.storyContrast, `${tier!.id} story contrast`).toBeGreaterThanOrEqual(4.5)
  }
  expect(tiers.find((tier) => tier?.id === 'luxury-dining')?.chapterBg).toContain('42, 8, 19')
  expect(tiers.find((tier) => tier?.id === 'premium-fast-casual')?.chapterBg).toContain('247, 220, 174')
  expect(tiers.find((tier) => tier?.id === 'social-dining')?.chapterBg).toContain('51, 58, 64')
  expect(tiers.find((tier) => tier?.id === 'social-dining')?.borderRadius).toBe('8px')

  const cafe = tiers.find((tier) => tier?.id === 'modern-cafe')
  expect(cafe?.chapterBackgroundColor).toBe('rgb(54, 161, 176)')
  expect(cafe?.chapterBg).toContain('54, 161, 176')
  expect(cafe?.chapterBg).not.toContain('251, 248, 238')
  expect(cafe?.chapterBg).not.toContain('237, 241, 223')
  expect(cafe?.storyColor).toBe('rgb(11, 42, 48)')
  expect(cafe?.cafe).toMatchObject({
    bodyColor: 'rgb(11, 42, 48)',
    previewBorderColor: 'rgba(6, 120, 150, 0.2)',
    cardBorderColor: 'rgba(6, 120, 150, 0.2)',
    cardTitleColor: 'rgb(11, 42, 48)',
    cardBodyColor: 'rgb(11, 42, 48)',
    inactivePillBackground: 'rgba(255, 255, 255, 0.86)',
    inactivePillColor: 'rgb(11, 42, 48)',
    activePillColor: 'rgb(255, 255, 255)',
    stageBackground: 'rgb(120, 186, 196)',
    primaryActionColor: 'rgb(255, 255, 255)',
  })
  expect(cafe?.cafe?.previewBackgroundImage).toContain('rgb(255, 255, 255) 0%, rgb(230, 251, 255) 100%')
  expect(cafe?.cafe?.cardBackgroundImage).toContain('rgb(255, 255, 255) 0%, rgb(230, 251, 255) 100%')
  expect(cafe?.cafe?.activePillBackground).toContain('rgb(8, 145, 178) 0%, rgb(14, 116, 144) 100%')
  expect(cafe?.cafe?.primaryActionBackground).toContain('rgb(8, 145, 178) 0%, rgb(14, 116, 144) 100%')
  expect(cafe?.cafe?.textOnChapterContrast).toBeGreaterThanOrEqual(4.5)
  expect(cafe?.cafe?.textOnCardContrast).toBeGreaterThanOrEqual(4.5)
  expect(cafe?.cafe?.pillContrast).toBeGreaterThanOrEqual(4.5)
  expect(cafe?.cafe?.activePillContrast).toBeGreaterThanOrEqual(3)
})

test('official branding and compact hero phone stay stable across key viewports', async ({ page }) => {
  await installModelViewerStub(page)
  for (const size of [
    { width: 390, height: 844, maxPhoneWidth: 292, maxPhoneHeight: 452 },
    { width: 1280, height: 577, minPhoneWidth: 300, maxPhoneWidth: 320, minPhoneHeight: 520, maxPhoneHeight: 570 },
    { width: 1440, height: 920, minPhoneWidth: 300, maxPhoneWidth: 320, minPhoneHeight: 520, maxPhoneHeight: 570 },
  ]) {
    await page.setViewportSize({ width: size.width, height: size.height })
    await page.goto('/')
    await expect(page.getByTestId('brand-logo-header')).toHaveAttribute('src', /\/assets\/brand\/betareal-logo-official\.png$/)

    const phoneMetrics = await page.getByTestId('hero-phone').evaluate((element) => {
      const rect = element.getBoundingClientRect()
      return {
        width: rect.width,
        height: rect.height,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
      }
    })
    expect(phoneMetrics.width, `phone width at ${size.width}x${size.height}`).toBeLessThanOrEqual(size.maxPhoneWidth)
    expect(phoneMetrics.height, `phone height at ${size.width}x${size.height}`).toBeLessThanOrEqual(size.maxPhoneHeight)
    if (size.minPhoneWidth) expect(phoneMetrics.width, `phone width at ${size.width}x${size.height}`).toBeGreaterThanOrEqual(size.minPhoneWidth)
    if (size.minPhoneHeight) expect(phoneMetrics.height, `phone height at ${size.width}x${size.height}`).toBeGreaterThanOrEqual(size.minPhoneHeight)
    expect(phoneMetrics.scrollHeight, `phone content clips at ${size.width}x${size.height}`).toBeLessThanOrEqual(phoneMetrics.clientHeight + 1)
  }
})

test('hero phone uses an inline model viewer with stable layers and direct gestures', async ({ page }) => {
  await installModelViewerStub(page)
  await page.setViewportSize({ width: 1440, height: 920 })
  await page.goto('/')

  await expect(page.getByText('Real model after tap')).toHaveCount(0)
  const heroFrame = page.getByTestId('inline-model-hero-bigburger')
  await expect(heroFrame).toHaveAttribute('data-inline-model-state', 'ready')
  await page.waitForTimeout(220)
  const viewer = heroFrame.locator('model-viewer')
  await expect(viewer).toHaveAttribute('src', /druidi_balanced_30k_2k\.glb/)
  await expect(viewer).toHaveAttribute('camera-controls', 'true')
  await expect(viewer).toHaveAttribute('max-camera-orbit', MODEL_VIEWER_MAX_CAMERA_ORBIT)
  await expect(viewer).not.toHaveAttribute('poster')

  const readyLayers = await heroFrame.evaluate((element) => {
    const poster = element.querySelector('img')
    const model = element.querySelector('model-viewer')
    if (!poster || !model) return null
    const frameRect = element.getBoundingClientRect()
    const posterRect = poster.getBoundingClientRect()
    const modelRect = model.getBoundingClientRect()
    const posterStyle = getComputedStyle(poster)
    const modelStyle = getComputedStyle(model)
    return {
      frame: { width: frameRect.width, height: frameRect.height },
      poster: { width: posterRect.width, height: posterRect.height, visible: posterStyle.visibility === 'visible' && Number(posterStyle.opacity) > 0 },
      model: { width: modelRect.width, height: modelRect.height, visible: modelStyle.visibility === 'visible' && Number(modelStyle.opacity) > 0 },
    }
  })
  expect(readyLayers).not.toBeNull()
  expect(readyLayers!.poster.width).toBeCloseTo(readyLayers!.frame.width, 1)
  expect(readyLayers!.poster.height).toBeCloseTo(readyLayers!.frame.height, 1)
  expect(readyLayers!.model.width).toBeCloseTo(readyLayers!.frame.width, 1)
  expect(readyLayers!.model.height).toBeCloseTo(readyLayers!.frame.height, 1)
  expect([readyLayers!.poster.visible, readyLayers!.model.visible].filter(Boolean)).toHaveLength(1)

  const beforeDrag = await viewer.evaluate((element) => (element as unknown as { getCameraOrbit: () => { theta: string; phi: string; radius: string } }).getCameraOrbit())
  await viewer.dispatchEvent('pointerdown')
  await viewer.dispatchEvent('pointermove')
  await viewer.dispatchEvent('pointerup')
  const afterDrag = await viewer.evaluate((element) => (element as unknown as { getCameraOrbit: () => { theta: string; phi: string; radius: string } }).getCameraOrbit())
  expect(afterDrag.theta).not.toBe(beforeDrag.theta)
  expect(Number.parseFloat(afterDrag.phi)).toBeLessThanOrEqual(MODEL_VIEWER_MAX_POLAR_DEG + 0.001)
  await expect(page.getByRole('dialog')).toHaveCount(0)

  await viewer.dispatchEvent('wheel', { deltaY: 120 })
  const afterWheel = await viewer.evaluate((element) => (element as unknown as { getCameraOrbit: () => { theta: string; radius: string } }).getCameraOrbit())
  expect(afterWheel.radius).not.toBe(afterDrag.radius)
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('hero inline model keeps one visible layer through loading, ready, and failure states', async ({ page }) => {
  await installModelViewerStub(page, { autoLoad: false })
  await page.goto('/')
  const heroFrame = page.getByTestId('inline-model-hero-bigburger')
  await expect(heroFrame).toHaveAttribute('data-inline-model-state', 'loading')

  async function layerState() {
    return heroFrame.evaluate((element) => {
      const poster = element.querySelector('img')
      const model = element.querySelector('model-viewer')
      if (!poster) return null
      const frameRect = element.getBoundingClientRect()
      const posterRect = poster.getBoundingClientRect()
      const modelRect = model?.getBoundingClientRect()
      const posterStyle = getComputedStyle(poster)
      const modelStyle = model ? getComputedStyle(model) : null
      return {
        frame: { width: frameRect.width, height: frameRect.height },
        poster: {
          width: posterRect.width,
          height: posterRect.height,
          visible: posterStyle.visibility === 'visible' && Number(posterStyle.opacity) > 0,
        },
        model: modelRect && modelStyle
          ? {
              width: modelRect.width,
              height: modelRect.height,
              visible: modelStyle.visibility === 'visible' && Number(modelStyle.opacity) > 0,
            }
          : null,
      }
    })
  }

  const loading = await layerState()
  expect(loading).not.toBeNull()
  expect(loading!.poster.visible).toBe(true)
  expect(loading!.model?.visible).toBe(false)
  expect(loading!.poster.width).toBeCloseTo(loading!.frame.width, 1)
  expect(loading!.poster.height).toBeCloseTo(loading!.frame.height, 1)

  await heroFrame.locator('model-viewer').dispatchEvent('load')
  await expect(heroFrame).toHaveAttribute('data-inline-model-state', 'ready')
  await page.waitForTimeout(220)
  const ready = await layerState()
  expect([ready!.poster.visible, ready!.model?.visible].filter(Boolean)).toHaveLength(1)
  expect(ready!.model?.width).toBeCloseTo(ready!.frame.width, 1)
  expect(ready!.model?.height).toBeCloseTo(ready!.frame.height, 1)

  await page.reload()
  const failedFrame = page.getByTestId('inline-model-hero-bigburger')
  await failedFrame.locator('model-viewer').dispatchEvent('error')
  await expect(failedFrame).toHaveAttribute('data-inline-model-state', 'failure')
  const failure = await failedFrame.evaluate((element) => {
    const poster = element.querySelector('img')
    const model = element.querySelector('model-viewer')
    if (!poster || !model) return null
    return {
      posterVisible: getComputedStyle(poster).visibility === 'visible' && Number(getComputedStyle(poster).opacity) > 0,
      modelVisible: getComputedStyle(model).visibility === 'visible' && Number(getComputedStyle(model).opacity) > 0,
    }
  })
  expect(failure).toEqual({ posterVisible: true, modelVisible: false })
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

test('luxury preview removes unavailable model cards and uses an intentional two-card layout', async ({ page }) => {
  await installModelViewerStub(page)
  await page.setViewportSize({ width: 1440, height: 920 })
  await page.goto('/')
  await page.locator('#luxury-dining').evaluate((element) => element.scrollIntoView({ block: 'start', behavior: 'instant' }))
  const luxuryDemo = page.getByTestId('luxury-dining-demo')
  await expect(luxuryDemo.getByText('Beef Stroganoff')).toHaveCount(0)
  await expect(luxuryDemo.getByText('Gazpacho')).toHaveCount(0)
  await expect(luxuryDemo.getByRole('heading', { name: 'Beef Fillet' })).toBeVisible()
  await expect(luxuryDemo.getByRole('heading', { name: 'Chocolate Croissant' })).toBeVisible()
  await expect(luxuryDemo.getByRole('button', { name: 'View in 3D: Beef Fillet' })).toHaveCount(0)
  await expect(luxuryDemo.getByTestId('inline-model-luxury-croissant-3d')).toBeVisible()

  const layout = await luxuryDemo.getByTestId('luxury-dining-preview-grid').evaluate((grid) => {
    const cards = Array.from(grid.querySelectorAll('article')).map((card) => card.getBoundingClientRect())
    const gridStyle = getComputedStyle(grid)
    return {
      count: cards.length,
      columns: gridStyle.gridTemplateColumns.split(' ').length,
      sameRow: Math.abs(cards[0].top - cards[1].top) < 2,
      gap: Number.parseFloat(gridStyle.columnGap),
    }
  })
  expect(layout).toEqual(expect.objectContaining({ count: 2, columns: 2, sameRow: true }))
  expect(layout.gap).toBeGreaterThanOrEqual(16)
})

test('inline model thumbnails preserve card media geometry and direct gestures do not open dialogs', async ({ page }) => {
  await installModelViewerStub(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.locator('#modern-cafe').evaluate((element) => element.scrollIntoView({ block: 'start', behavior: 'instant' }))

  const cafeDemo = page.getByTestId('modern-cafe-demo')
  const nonModelButton = cafeDemo.getByRole('button', { name: 'Details: Chia Fruit Bowl' })
  await expect(nonModelButton.getByRole('img', { name: 'Chia Fruit Bowl' })).toBeVisible()
  await expect(cafeDemo.getByTestId('inline-model-cafe-chia')).toHaveCount(0)

  const thumbnail = page.getByTestId('inline-model-cafe-croissant')
  await thumbnail.scrollIntoViewIfNeeded()
  await expect(thumbnail).toHaveAttribute('data-inline-model-state', 'ready')
  await page.waitForTimeout(220)
  const viewer = thumbnail.locator('model-viewer')
  await expect(viewer).toHaveAttribute('camera-controls', 'true')
  await expect(viewer).toHaveAttribute('max-camera-orbit', MODEL_VIEWER_MAX_CAMERA_ORBIT)
  await expect(viewer).toHaveAttribute('touch-action', 'pan-y')
  await expect(viewer).toHaveAttribute('auto-rotate', 'true')
  await expect(viewer).not.toHaveAttribute('poster')

  const layerRects = await thumbnail.evaluate((element) => {
    const poster = element.querySelector('img')
    const viewer = element.querySelector('model-viewer')
    if (!poster || !viewer) return null
    const frameRect = element.getBoundingClientRect()
    const posterRect = poster.getBoundingClientRect()
    const viewerRect = viewer.getBoundingClientRect()
    const posterStyle = getComputedStyle(poster)
    const viewerStyle = getComputedStyle(viewer)
    return {
      frame: { width: frameRect.width, height: frameRect.height },
      poster: { width: posterRect.width, height: posterRect.height, visibility: posterStyle.visibility, opacity: posterStyle.opacity },
      viewer: { width: viewerRect.width, height: viewerRect.height, visibility: viewerStyle.visibility, opacity: viewerStyle.opacity },
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    }
  })
  expect(layerRects).not.toBeNull()
  expect(layerRects!.poster.width).toBeCloseTo(layerRects!.frame.width, 1)
  expect(layerRects!.poster.height).toBeCloseTo(layerRects!.frame.height, 1)
  expect(layerRects!.viewer.width).toBeCloseTo(layerRects!.frame.width, 1)
  expect(layerRects!.viewer.height).toBeCloseTo(layerRects!.frame.height, 1)
  expect(layerRects!.poster.visibility).toBe('hidden')
  expect(Number(layerRects!.poster.opacity)).toBe(0)
  expect(layerRects!.viewer.visibility).toBe('visible')
  expect(Number(layerRects!.viewer.opacity)).toBe(1)
  expect(layerRects!.overflow).toBe(false)

  await viewer.dispatchEvent('pointerdown')
  await viewer.dispatchEvent('pointermove')
  await viewer.dispatchEvent('pointerup')
  await expect(page.getByRole('dialog')).toHaveCount(0)

  await cafeDemo.getByRole('button', { name: 'View in 3D: Chocolate Croissant' }).click()
  await expect(page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Chocolate Croissant' }) })).toBeVisible()
  await page.keyboard.press('Escape')
  await cafeDemo.getByRole('button', { name: 'Place in AR: Chocolate Croissant' }).click()
  await expect(page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Chocolate Croissant' }) })).toBeVisible()
})

test('every model viewer keeps the camera at least 20 degrees above the support plane while rotation and zoom stay usable', async ({ page }) => {
  await installModelViewerStub(page)
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/')

  for (const id of ['luxury-dining', 'modern-cafe', 'premium-fast-casual', 'social-dining']) {
    await page.locator(`#${id}`).evaluate((element) => element.scrollIntoView({ block: 'start', behavior: 'instant' }))
    await page.waitForTimeout(120)
  }

  const inlineViewers = page.locator('model-viewer')
  const inlineCount = await inlineViewers.count()
  expect(inlineCount).toBeGreaterThan(1)
  for (let index = 0; index < inlineCount; index += 1) {
    const viewer = inlineViewers.nth(index)
    await expect(viewer).toHaveAttribute('camera-controls', 'true')
    await expect(viewer).toHaveAttribute('max-camera-orbit', MODEL_VIEWER_MAX_CAMERA_ORBIT)
  }

  const thumbnail = page.getByTestId('inline-model-cafe-croissant')
  await thumbnail.scrollIntoViewIfNeeded()
  const viewer = thumbnail.locator('model-viewer')
  const before = await viewer.evaluate((element) => (element as unknown as { getCameraOrbit: () => { theta: string; phi: string; radius: string } }).getCameraOrbit())
  const box = await viewer.boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
  await page.mouse.down()
  await page.mouse.move(box!.x + box!.width / 2 + 260, box!.y + box!.height / 2 + 260, { steps: 8 })
  await page.mouse.up()
  const afterOrbit = await viewer.evaluate((element) => (element as unknown as { getCameraOrbit: () => { theta: string; phi: string; radius: string } }).getCameraOrbit())
  expect(afterOrbit.theta).not.toBe(before.theta)
  expect(Number.parseFloat(afterOrbit.phi)).toBeLessThanOrEqual(MODEL_VIEWER_MAX_POLAR_DEG + 0.001)
  await expect(page.getByRole('dialog')).toHaveCount(0)

  await viewer.dispatchEvent('wheel', { deltaY: 240 })
  const afterZoom = await viewer.evaluate((element) => (element as unknown as { getCameraOrbit: () => { radius: string } }).getCameraOrbit())
  expect(afterZoom.radius).not.toBe(afterOrbit.radius)
  await expect(page.getByRole('dialog')).toHaveCount(0)

  await page.getByRole('button', { name: 'View in 3D: Chocolate Croissant' }).first().click()
  const modalViewer = page.getByRole('dialog').locator('model-viewer')
  await expect(modalViewer).toHaveAttribute('camera-orbit', '20deg 68deg 105%')
  await expect(modalViewer).toHaveAttribute('max-camera-orbit', MODEL_VIEWER_MAX_CAMERA_ORBIT)
  await expect(modalViewer).toHaveAttribute('ar', 'true')
  await expect(modalViewer).toHaveAttribute('ios-src', /\.usdz/)
})

test('inline model thumbnails keep only the poster painted while loading or failed', async ({ page }) => {
  await installModelViewerStub(page, { autoLoad: false })
  await page.goto('/')
  await page.locator('#premium-fast-casual').evaluate((element) => element.scrollIntoView({ block: 'start', behavior: 'instant' }))
  const loadingThumbnail = page.getByTestId('inline-model-fast-bigburger')
  await expect(loadingThumbnail).toHaveAttribute('data-inline-model-state', 'loading')
  const loadingState = await loadingThumbnail.evaluate((element) => {
    const poster = element.querySelector('img')
    const viewer = element.querySelector('model-viewer')
    if (!poster || !viewer) return null
    return {
      posterVisibility: getComputedStyle(poster).visibility,
      viewerVisibility: getComputedStyle(viewer).visibility,
      viewerPointerEvents: getComputedStyle(viewer).pointerEvents,
    }
  })
  expect(loadingState).toEqual({ posterVisibility: 'visible', viewerVisibility: 'hidden', viewerPointerEvents: 'none' })

  await page.reload()
  await page.locator('#premium-fast-casual').evaluate((element) => element.scrollIntoView({ block: 'start', behavior: 'instant' }))
  const failedThumbnail = page.getByTestId('inline-model-fast-bigburger')
  await failedThumbnail.locator('model-viewer').dispatchEvent('error')
  await expect(failedThumbnail).toHaveAttribute('data-inline-model-state', 'failure')
  await expect(failedThumbnail.locator('model-viewer')).toHaveCSS('visibility', 'hidden')
  await expect(failedThumbnail.getByRole('img', { name: 'BigBurger' })).toBeVisible()
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

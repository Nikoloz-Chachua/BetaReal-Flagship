/// <reference types="node" />
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../src/App'
import { FlagshipPage } from '../src/pages/FlagshipPage'
import { localAssets } from '../src/data/assets'
import { segmentRoutes, segments } from '../src/data/segments'
import { resetAnalyticsDedupeForTests, trackEvent } from '../src/lib/analytics'
import { ensureModelViewerScript, launchModelViewerAR, MODEL_VIEWER_MAX_CAMERA_ORBIT, type ModelViewerARElement } from '../src/lib/modelViewer'
import * as modelViewer from '../src/lib/modelViewer'
import { sanitizeRestaurantParam, sanitizeTrackingParam } from '../src/lib/personalization'
import { normalizeBasePath, stripBasePath, withBasePath } from '../src/lib/basePath'
import {
  buildLeadMessage,
  buildMailtoUrl,
  buildWhatsAppUrl,
  PRIMARY_PHONE_E164,
  SECONDARY_PHONE_E164,
} from '../src/lib/leadLinks'
import headersText from '../public/_headers?raw'
import indexHtml from '../index.html?raw'

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = []
  callback: IntersectionObserverCallback
  elements: Element[] = []
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    this.observe = vi.fn((element: Element) => {
      this.elements.push(element)
    })
    MockIntersectionObserver.instances.push(this)
  }

  trigger(isIntersecting = true) {
    this.callback(
      this.elements.map((target) => ({
        target,
        isIntersecting,
        intersectionRatio: isIntersecting ? 1 : 0,
      })) as IntersectionObserverEntry[],
      this as unknown as IntersectionObserver,
    )
  }
}

function popupHandle() {
  return {
    opener: window,
    close: vi.fn(),
    location: {
      href: '',
      replace: vi.fn(),
    },
  } as unknown as Window & { location: Location & { replace: ReturnType<typeof vi.fn> }; close: ReturnType<typeof vi.fn> }
}

function extractJsonLdHash(html: string) {
  const match = html.match(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/)
  if (!match) throw new Error('Missing inline JSON-LD script')
  return `sha256-${createHash('sha256').update(match[1], 'utf8').digest('base64')}`
}

function decodedWhatsAppText(url: string) {
  return new URL(url).searchParams.get('text') ?? ''
}

beforeEach(() => {
  vi.restoreAllMocks()
  MockIntersectionObserver.instances = []
  HTMLElement.prototype.scrollIntoView = vi.fn()
  document.head.querySelectorAll('script[data-betareal-model-viewer]').forEach((script) => script.remove())
  window.history.replaceState({}, '', '/')
  window.dataLayer = []
  resetAnalyticsDedupeForTests()
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
  vi.spyOn(window, 'open').mockImplementation(() => null)
})

function triggerObservedInlineModels() {
  act(() => {
    MockIntersectionObserver.instances.forEach((observer) => observer.trigger())
  })
}

describe('segment architecture', () => {
  it('defines all configured routes and hashes', () => {
    expect(segmentRoutes).toEqual(['luxury', 'cafe', 'fast-casual', 'social-dining'])
    expect(segments.map((segment) => segment.id)).toEqual([
      'luxury-dining',
      'modern-cafe',
      'premium-fast-casual',
      'social-dining',
    ])
    expect(segments.every((segment) => segment.items.length >= 2)).toBe(true)
  })

  it('renders all chapter headings from config', () => {
    render(<FlagshipPage />)
    expect(screen.getByRole('heading', { name: 'Fine Dining, Made Interactive.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Fresh Design for Modern Dining.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Fast Food Without Generic Design.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Built for Busy Places.' })).toBeInTheDocument()
  })

  it('uses the official logo and keeps the luxury preview honest', () => {
    expect(localAssets.logos.official).toContain('/assets/brand/betareal-logo-official.png')
    expect(Object.values(localAssets.logos)).toEqual([localAssets.logos.official])
    expect(localAssets.chapters.luxury.hero).toContain('/assets/chapters/luxury/interior-enhanced-wide.webp')
    expect(localAssets.chapters.luxury.support).toContain('/assets/chapters/luxury/interior-enhanced-portrait.webp')

    const luxury = segments.find((segment) => segment.id === 'luxury-dining')
    expect(luxury?.items.map((item) => item.name.en)).toEqual(['Beef Fillet', 'Chocolate Croissant'])
    expect(luxury?.items.map((item) => item.name.en)).not.toContain('Beef Stroganoff')
    expect(luxury?.items.map((item) => item.name.en)).not.toContain('Gazpacho')
    expect(luxury?.items.map((item) => [item.name.en, item.image, Boolean(item.model)])).toEqual([
      ['Beef Fillet', expect.stringContaining('/assets/chapters/luxury/dishes/mg-beef-fillet.png'), false],
      ['Chocolate Croissant', expect.stringContaining('/assets/models/croissant_poster.webp'), true],
    ])
  })

  it('uses the live Monday Greens palette only for the modern cafe segment', () => {
    const cafe = segments.find((segment) => segment.id === 'modern-cafe')
    expect(cafe?.theme).toMatchObject({
      background: '#36a1b0',
      surface: '#ffffff',
      ink: '#0b2a30',
      muted: '#0b2a30',
      accent: '#0891b2',
      accent2: '#e6fbff',
      accent3: '#0e7490',
      layout: 'cafe',
    })
    expect(cafe?.verifiedClientNote?.en).toBe('Includes visual reference from Monday Greens, verified BetaReal client work.')

    expect(segments.find((segment) => segment.id === 'luxury-dining')?.theme.background).toBe('#2A0813')
    expect(segments.find((segment) => segment.id === 'premium-fast-casual')?.theme.background).toBe('#F3D19D')
    expect(segments.find((segment) => segment.id === 'social-dining')?.theme.background).toBe('#2D3338')
  })
})

describe('deployment base path', () => {
  it('supports root Cloudflare hosting and the GitHub Pages preview subpath', () => {
    expect(normalizeBasePath('/')).toBe('')
    expect(normalizeBasePath('/BetaReal-Flagship/')).toBe('/BetaReal-Flagship')
    expect(stripBasePath('/BetaReal-Flagship/', '/BetaReal-Flagship')).toBe('/')
    expect(stripBasePath('/BetaReal-Flagship/demo/cafe', '/BetaReal-Flagship')).toBe('/demo/cafe')
    expect(withBasePath('/', '/BetaReal-Flagship')).toBe('/BetaReal-Flagship/')
  })
})

describe('personalization', () => {
  it('sanitizes and bounds restaurant query text', () => {
    expect(sanitizeRestaurantParam('  Demo Bistro  ')).toBe('Demo Bistro')
    expect(sanitizeRestaurantParam('<img src=x>')).toBeNull()
    expect(sanitizeRestaurantParam(`Bad${String.fromCharCode(7)}`)).toBeNull()
    expect(Array.from(sanitizeRestaurantParam('ა'.repeat(80)) ?? '')).toHaveLength(60)
  })

  it('sanitizes bounded tracking query values and rejects PII or markup', () => {
    expect(sanitizeTrackingParam('  paid launch.q3_2026  ')).toBe('paid-launch.q3_2026')
    expect(sanitizeTrackingParam('nino@example.com')).toBeUndefined()
    expect(sanitizeTrackingParam('+995 555 000 000')).toBeUndefined()
    expect(sanitizeTrackingParam('qa\nsource')).toBeUndefined()
    expect(sanitizeTrackingParam('<script>')).toBeUndefined()
    expect(sanitizeTrackingParam('https://example.com')).toBeUndefined()
    expect(sanitizeTrackingParam('აsource')).toBeUndefined()
    expect(sanitizeTrackingParam('a'.repeat(90))).toHaveLength(64)
  })

  it('renders dismissible safe prospect banner', async () => {
    window.history.replaceState({}, '', '/?restaurant=Demo%20Bistro')
    render(<FlagshipPage />)
    expect(screen.getByText('Demo Bistro')).toBeInTheDocument()
    await userEvent.click(screen.getByLabelText('Dismiss personalized banner'))
    expect(screen.queryByText('Demo Bistro')).not.toBeInTheDocument()
  })
})

describe('language and model loading', () => {
  it('switches visible content to Georgian and preserves route access', async () => {
    const description = document.createElement('meta')
    description.name = 'description'
    document.head.append(description)
    render(<FlagshipPage />)
    await userEvent.click(screen.getByRole('button', { name: 'KA' }))
    expect(screen.getByRole('heading', { name: 'თქვენი მენიუ ეკრანს მიღმა.' })).toBeInTheDocument()
    expect(screen.getByText('ერთი კერძი. დაგემოვნებამდე მისი გაცნობის სამი გზა.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /პრემიუმ რესტორნები/ })).toHaveAttribute('href', '#luxury-dining')
    expect(document.title).toBe('BetaReal — ინტერაქტიული 3D და AR მენიუები რესტორნებისთვის.')
    expect(description.content).toBe(
      'BetaReal რესტორნებისთვის ქმნის ინდივიდუალურ ვებსაიტებსა და ციფრულ მენიუებს, სადაც სტუმრებს შეუძლიათ კერძები 3D-ში დაათვალიერონ და AR-ის საშუალებით საკუთარ მაგიდაზე განათავსონ.',
    )
    description.remove()
  })

  it('does not inject model-viewer until explicit interaction', async () => {
    render(<FlagshipPage />)
    expect(document.querySelector('script[data-betareal-model-viewer]')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: /View a Dish in 3D/ }))
    await waitFor(() => expect(document.querySelector('script[data-betareal-model-viewer]')).toBeInTheDocument())
  })

  it('only renders 3D and AR card controls for model-enabled items', () => {
    render(<FlagshipPage />)
    expect(screen.queryAllByRole('button', { name: /^3D$/ })).toHaveLength(0)
    expect(screen.getAllByRole('button', { name: 'View in 3D: Chocolate Croissant' }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'View in 3D: Chia Fruit Bowl' })).not.toBeInTheDocument()
  })

  it('renders the hero phone as an inline model viewer without the removed orbit badge', async () => {
    vi.spyOn(modelViewer, 'ensureModelViewerScript').mockResolvedValue(true)

    render(<FlagshipPage />)
    expect(screen.getByText('WEB · 3D · AR')).toBeInTheDocument()
    expect(screen.queryByText('Real model after tap')).not.toBeInTheDocument()
    expect(screen.getByText('ONE DISH. THREE WAYS TO EXPERIENCE IT BEFORE TASTING.')).toBeInTheDocument()
    const heroViewer = screen.getByTestId('inline-model-hero-bigburger')
    expect(heroViewer).toHaveAttribute('data-inline-model-state', 'initial')
    expect(within(heroViewer).getByRole('img', { name: 'BigBurger' })).toBeInTheDocument()

    triggerObservedInlineModels()
    const viewer = await waitFor(() => {
      const element = heroViewer.querySelector('model-viewer')
      if (!element) throw new Error('hero model-viewer was not rendered')
      return element
    })
    expect(viewer).toHaveAttribute('src', expect.stringContaining('druidi_balanced_30k_2k.glb'))
    expect(viewer).toHaveAttribute('camera-controls', 'true')
    expect(viewer).toHaveAttribute('max-camera-orbit', MODEL_VIEWER_MAX_CAMERA_ORBIT)
    expect(viewer).toHaveAttribute('touch-action', 'pan-y')
    expect(viewer).not.toHaveAttribute('poster')
  })

  it('resets model-viewer script loading after a network failure', async () => {
    const first = ensureModelViewerScript()
    const failedScript = document.querySelector<HTMLScriptElement>('script[data-betareal-model-viewer]')
    expect(failedScript).toBeInTheDocument()
    failedScript?.dispatchEvent(new Event('error'))
    await expect(first).resolves.toBe(false)
    expect(document.querySelector('script[data-betareal-model-viewer]')).toBeNull()

    const second = ensureModelViewerScript()
    const retryScript = document.querySelector<HTMLScriptElement>('script[data-betareal-model-viewer]')
    expect(retryScript).toBeInTheDocument()
    retryScript?.dispatchEvent(new Event('error'))
    await expect(second).resolves.toBe(false)
  })

  it('keeps photo-only dishes static while preserving real model controls', async () => {
    render(<FlagshipPage initialSegment="cafe" />)
    const cafeDemo = screen.getByTestId('modern-cafe-demo')
    const photo = within(cafeDemo).getByRole('img', { name: 'Chia Fruit Bowl' })
    expect(photo.closest('button')).toBeNull()
    expect(within(cafeDemo).queryByRole('button', { name: 'Details: Chia Fruit Bowl' })).not.toBeInTheDocument()
    expect(within(cafeDemo).queryByTestId('inline-model-cafe-chia')).not.toBeInTheDocument()
    expect(within(cafeDemo).getByLabelText('Preview categories').querySelectorAll('button')).toHaveLength(0)

    await userEvent.click(photo)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(within(cafeDemo).getByRole('button', { name: 'View in 3D: Chocolate Croissant' })).toBeInTheDocument()
    expect(within(cafeDemo).getByRole('button', { name: 'Place in AR: Chocolate Croissant' })).toBeInTheDocument()
  })

  it('lazy-loads inline model thumbnails only after a model card enters the observer', async () => {
    render(<FlagshipPage initialSegment="cafe" />)
    const thumbnail = screen.getByTestId('inline-model-cafe-croissant')
    expect(thumbnail).toHaveAttribute('data-inline-model-state', 'initial')
    expect(document.querySelector('script[data-betareal-model-viewer]')).toBeNull()
    expect(thumbnail.querySelector('model-viewer')).toBeNull()

    triggerObservedInlineModels()
    await waitFor(() => expect(document.querySelector('script[data-betareal-model-viewer]')).toBeInTheDocument())
    expect(thumbnail).toHaveAttribute('data-inline-model-state', 'loading')

    const script = document.querySelector<HTMLScriptElement>('script[data-betareal-model-viewer]')
    script?.dispatchEvent(new Event('error'))
    await waitFor(() => expect(thumbnail).toHaveAttribute('data-inline-model-state', 'failure'))
    expect(thumbnail.querySelector('model-viewer')).toBeNull()
    expect(within(thumbnail).getByRole('img', { name: 'Chocolate Croissant' })).toBeInTheDocument()
  })

  it('reveals a loaded inline model as the only visible thumbnail layer', async () => {
    vi.spyOn(modelViewer, 'ensureModelViewerScript').mockResolvedValue(true)

    render(<FlagshipPage initialSegment="cafe" />)
    const thumbnail = screen.getByTestId('inline-model-cafe-croissant')
    triggerObservedInlineModels()

    const viewer = await waitFor(() => {
      const element = thumbnail.querySelector('model-viewer')
      if (!element) throw new Error('inline model-viewer was not rendered')
      return element
    })
    act(() => {
      viewer.dispatchEvent(new Event('load', { bubbles: true }))
    })
    await waitFor(() => expect(thumbnail).toHaveAttribute('data-inline-model-state', 'ready'))
    expect(viewer).toHaveAttribute('camera-controls', 'true')
    expect(viewer).toHaveAttribute('max-camera-orbit', MODEL_VIEWER_MAX_CAMERA_ORBIT)
    expect(viewer).toHaveAttribute('touch-action', 'pan-y')
    expect(viewer).toHaveAttribute('auto-rotate', 'true')
    expect(viewer).not.toHaveAttribute('poster')
    expect(thumbnail.querySelector('img[alt="Chocolate Croissant"]')).toBeInTheDocument()
  })

  it('keeps every rendered model-viewer camera at least 20 degrees above the support plane', async () => {
    vi.spyOn(modelViewer, 'ensureModelViewerScript').mockResolvedValue(true)

    render(<FlagshipPage initialSegment="cafe" />)
    triggerObservedInlineModels()

    await waitFor(() => {
      expect(document.querySelectorAll('model-viewer').length).toBeGreaterThan(1)
    })
    for (const viewer of Array.from(document.querySelectorAll('model-viewer'))) {
      expect(viewer).toHaveAttribute('camera-controls', 'true')
      expect(viewer).toHaveAttribute('max-camera-orbit', MODEL_VIEWER_MAX_CAMERA_ORBIT)
    }

    await userEvent.click(screen.getAllByRole('button', { name: 'View in 3D: Chocolate Croissant' })[0])
    const fullViewer = await waitFor(() => {
      const dialog = screen.getByRole('dialog')
      const element = dialog.querySelector('model-viewer')
      if (!element) throw new Error('modal model-viewer was not rendered')
      return element
    })
    expect(fullViewer).toHaveAttribute('camera-orbit', '20deg 68deg 105%')
    expect(fullViewer).toHaveAttribute('max-camera-orbit', MODEL_VIEWER_MAX_CAMERA_ORBIT)
    expect(fullViewer).toHaveAttribute('ar', 'true')
    expect(fullViewer).toHaveAttribute('ios-src', expect.stringContaining('.usdz'))
  })

  it('tracks only the first inline model thumbnail interaction per rendered item', async () => {
    vi.spyOn(modelViewer, 'ensureModelViewerScript').mockResolvedValue(true)
    const events: Array<Record<string, string | undefined>> = []
    window.addEventListener('betareal:analytics', (event) => {
      events.push((event as CustomEvent<Record<string, string | undefined>>).detail)
    })

    render(<FlagshipPage initialSegment="cafe" />)
    const thumbnail = screen.getByTestId('inline-model-cafe-croissant')
    triggerObservedInlineModels()
    const viewer = await waitFor(() => {
      const element = thumbnail.querySelector('model-viewer')
      if (!element) throw new Error('inline model-viewer was not rendered')
      return element
    })

    viewer.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    viewer.dispatchEvent(new WheelEvent('wheel', { bubbles: true }))
    const inlineEvents = events.filter((event) => event.event === 'inline_model_thumbnail_interacted')
    expect(inlineEvents).toHaveLength(1)
    expect(inlineEvents[0]).toMatchObject({ segment: 'cafe', item: 'cafe-croissant' })
  })
})

describe('lead flow and analytics', () => {
  it('builds safe WhatsApp and mailto URLs', () => {
    const message = buildLeadMessage(
      {
        restaurant: 'Demo Bistro',
        person: 'Nino',
        contact: '+995 555 000 000',
        category: 'cafe',
        existing: 'instagram.com/demo',
        message: 'Need AR',
      },
      { source: 'site', campaign: 'launch', prospect: 'Demo Bistro' },
    )
    expect(message).toContain('Restaurant: Demo Bistro')
    expect(buildWhatsAppUrl(message)).toMatch(/^https:\/\/wa\.me\/995593191707\?text=/)
    expect(decodeURIComponent(buildMailtoUrl(message))).toContain('betareal.ar@gmail.com')
  })

  it('builds localized Georgian prepared lead messages without English field leaks', () => {
    const message = buildLeadMessage(
      {
        restaurant: 'დემო ბისტრო',
        person: 'ნინო გიორგაძე',
        contact: '+995 555 000 000',
        category: 'social-dining',
        existing: 'instagram.com/demo',
        message: 'გვაინტერესებს 3D და AR',
      },
      { source: 'site', campaign: 'launch', prospect: 'დემო ბისტრო' },
      'ka',
    )
    expect(message).toContain('BetaReal დემოს მოთხოვნა')
    expect(message).toContain('რესტორანი: დემო ბისტრო')
    expect(message).toContain('საკონტაქტო პირი: ნინო გიორგაძე')
    expect(message).toContain('კატეგორია: თავშეყრის სივრცეები')
    expect(message).toContain('შეტყობინება: გვაინტერესებს 3D და AR')
    expect(message).not.toContain('Restaurant:')
    expect(message).not.toContain('Category: social-dining')
    expect(decodeURIComponent(buildMailtoUrl(message, 'ka'))).toContain('subject=BetaReal დემოს მოთხოვნა')
  })

  it('validates form accessibly and reports successful WhatsApp opening only with a handle', async () => {
    const handle = popupHandle()
    vi.mocked(window.open).mockImplementation(() => handle)
    render(<FlagshipPage />)
    await userEvent.click(screen.getByRole('button', { name: 'Prepare WhatsApp message' }))
    expect(screen.getAllByText('This field is required.').length).toBeGreaterThan(1)
    expect(screen.getByRole('alert')).toHaveTextContent('Please check the highlighted fields.')
    expect(screen.getByLabelText('Restaurant name')).toHaveFocus()
    expect(screen.getByLabelText('Restaurant name')).toHaveAttribute('aria-describedby', expect.stringContaining('lead-restaurant-error'))
    await userEvent.type(screen.getByLabelText('Restaurant name'), 'Demo Bistro')
    await userEvent.type(screen.getByLabelText('Contact person'), 'Nino')
    await userEvent.type(screen.getByLabelText('Phone or email'), '+995 555 000 000')
    await userEvent.selectOptions(screen.getByLabelText('Restaurant category'), 'cafe')
    await userEvent.click(screen.getByLabelText('I agree to contact BetaReal about this request.'))
    await userEvent.click(screen.getByRole('button', { name: 'Prepare WhatsApp message' }))
    expect(window.open).toHaveBeenCalledWith('', '_blank')
    expect(handle.opener).toBeNull()
    expect(handle.location.replace).toHaveBeenCalledWith(expect.stringContaining('https://wa.me/995593191707?text='))
    expect(screen.getByRole('status')).toHaveTextContent('The prepared WhatsApp conversation opened')
  })

  it('preserves multi-word Georgian lead fields and multiline message until WhatsApp message construction', async () => {
    const handle = popupHandle()
    vi.mocked(window.open).mockImplementation(() => handle)
    render(<FlagshipPage />)
    await userEvent.type(screen.getByLabelText('Restaurant name'), 'Demo Bistro')
    await userEvent.type(screen.getByLabelText('Contact person'), 'ნინო გიორგაძე')
    await userEvent.type(screen.getByLabelText('Phone or email'), '+995 555 000 000')
    await userEvent.selectOptions(screen.getByLabelText('Restaurant category'), 'cafe')
    await userEvent.type(screen.getByLabelText('Optional message'), 'Need more details{enter}Second line with spaces')
    await userEvent.click(screen.getByLabelText('I agree to contact BetaReal about this request.'))

    expect(screen.getByLabelText('Restaurant name')).toHaveValue('Demo Bistro')
    expect(screen.getByLabelText('Contact person')).toHaveValue('ნინო გიორგაძე')
    expect(screen.getByLabelText('Optional message')).toHaveValue('Need more details\nSecond line with spaces')

    await userEvent.click(screen.getByRole('button', { name: 'Prepare WhatsApp message' }))
    const url = handle.location.replace.mock.calls[0]?.[0] as string
    const message = decodedWhatsAppText(url)
    expect(message).toContain('Restaurant: Demo Bistro')
    expect(message).toContain('Contact person: ნინო გიორგაძე')
    expect(message).toContain('Message: Need more details\nSecond line with spaces')
  })

  it('shows a WhatsApp fallback link when popup opening is blocked', async () => {
    render(<FlagshipPage />)
    await userEvent.type(screen.getByLabelText('Restaurant name'), 'Demo Bistro')
    await userEvent.type(screen.getByLabelText('Contact person'), 'Nino')
    await userEvent.type(screen.getByLabelText('Phone or email'), '+995 555 000 000')
    await userEvent.selectOptions(screen.getByLabelText('Restaurant category'), 'cafe')
    await userEvent.click(screen.getByLabelText('I agree to contact BetaReal about this request.'))
    await userEvent.click(screen.getByRole('button', { name: 'Prepare WhatsApp message' }))

    expect(screen.getByRole('status')).toHaveTextContent('WhatsApp did not open automatically')
    expect(screen.getByRole('link', { name: 'Open prepared WhatsApp message' })).toHaveAttribute(
      'href',
      expect.stringContaining('https://wa.me/995593191707?text='),
    )
  })

  it('deduplicates section views and strips PII from analytics payloads', () => {
    const events: Array<Record<string, string | undefined>> = []
    window.addEventListener('betareal:analytics', (event) => {
      events.push((event as CustomEvent<Record<string, string | undefined>>).detail)
    })
    trackEvent('experience_section_viewed', { segment: 'cafe', source: 'newsletter', campaign: 'q3' })
    trackEvent('experience_section_viewed', { segment: 'cafe', source: 'newsletter', campaign: 'q3' })
    trackEvent('contact_form_submitted', {
      segment: 'cafe',
      source: 'nino@example.com',
      campaign: '+995 555 000 000',
    })
    expect(events).toHaveLength(2)
    expect(Object.keys(events[1])).toEqual(['event', 'segment', 'demo', 'source', 'campaign'])
    expect(events[1].source).toBeUndefined()
    expect(events[1].campaign).toBeUndefined()
    expect(window.dataLayer?.[1].source).toBeUndefined()
  })

  it('omits unsafe tracking context from generated messages and never uses prospect in analytics metadata', () => {
    window.history.replaceState({}, '', '/?restaurant=Demo%20Bistro&utm_source=nino@example.com&utm_campaign=%2B995555000000')
    const events: Array<Record<string, string | undefined>> = []
    window.addEventListener('betareal:analytics', (event) => {
      events.push((event as CustomEvent<Record<string, string | undefined>>).detail)
    }, { once: true })
    render(<FlagshipPage />)

    const message = buildLeadMessage(
      {
        restaurant: 'Demo Bistro',
        person: 'ნინო',
        contact: '+995 555 000 000',
        category: 'cafe',
        existing: '',
        message: 'Need AR',
      },
      { source: 'nino@example.com', campaign: '+995 555 000 000', prospect: 'Demo Bistro' },
    )
    expect(message).not.toContain('Source:')
    expect(message).not.toContain('Campaign:')
    return waitFor(() => {
      expect(events[0]).not.toHaveProperty('prospect')
      expect(window.dataLayer?.[0]).not.toHaveProperty('prospect')
    })
  })

  it('emits the initial section view once and deduplicates the same section', async () => {
    const events: Array<Record<string, string | undefined>> = []
    window.addEventListener('betareal:analytics', (event) => {
      events.push((event as CustomEvent<Record<string, string | undefined>>).detail)
    })
    render(<FlagshipPage initialSegment="cafe" />)
    await waitFor(() => expect(events.filter((event) => event.event === 'experience_section_viewed')).toHaveLength(1))
    trackEvent('experience_section_viewed', { segment: 'cafe' })
    expect(events.filter((event) => event.event === 'experience_section_viewed')).toHaveLength(1)
  })

  it('uses a valid query segment for the first section-view analytics payload', async () => {
    window.history.replaceState({}, '', '/?segment=cafe&utm_source=qa')
    const events: Array<Record<string, string | undefined>> = []
    window.addEventListener('betareal:analytics', (event) => {
      events.push((event as CustomEvent<Record<string, string | undefined>>).detail)
    })
    render(<FlagshipPage />)
    await waitFor(() => expect(events.find((event) => event.event === 'experience_section_viewed')).toBeTruthy())
    const sectionViews = events.filter((event) => event.event === 'experience_section_viewed')
    expect(sectionViews[0]).toMatchObject({ segment: 'cafe', source: 'qa' })
    expect(sectionViews).toHaveLength(1)
  })
})

describe('AR and routing behavior', () => {
  it('awaits supported, unsupported, and rejected model-viewer AR activation paths', async () => {
    const supported = {
      activateAR: vi.fn().mockResolvedValue(undefined),
    } as unknown as ModelViewerARElement
    const rejected = {
      activateAR: vi.fn().mockRejectedValue(new Error('no ar')),
    } as unknown as ModelViewerARElement

    await expect(launchModelViewerAR(supported)).resolves.toBe(true)
    await expect(launchModelViewerAR({} as ModelViewerARElement)).resolves.toBe(false)
    await expect(launchModelViewerAR(rejected)).resolves.toBe(false)
  })

  it('keeps actionable AR fallback controls after model-viewer script failure', async () => {
    render(<FlagshipPage />)
    await userEvent.click(screen.getAllByRole('button', { name: 'Place in AR: Chocolate Croissant' })[0])
    const script = await waitFor(() => {
      const element = document.querySelector<HTMLScriptElement>('script[data-betareal-model-viewer]')
      if (!element) throw new Error('model-viewer script was not injected')
      return element
    })
    script.dispatchEvent(new Event('error'))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeVisible())
    expect(screen.getAllByText("AR isn't available here, so the interactive 3D view is open.").length).toBeGreaterThan(0)
    expect(within(screen.getByRole('dialog')).getByRole('img', { name: 'Croissant' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Retry 3D viewer' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Open Full Demo' })).toHaveAttribute('href', 'https://restaurant-ar.pages.dev/?tenant=b-main')
  })

  it('keeps the AR fallback notice visible after opening the model modal', async () => {
    if (!window.customElements.get('model-viewer')) {
      window.customElements.define('model-viewer', class extends HTMLElement {})
    }
    render(<FlagshipPage />)
    await userEvent.click(screen.getAllByRole('button', { name: 'Place in AR: Chocolate Croissant' })[0])
    await waitFor(() => expect(screen.getByRole('dialog')).toBeVisible())
    expect(screen.getAllByText("AR isn't available here, so the interactive 3D view is open.").length).toBeGreaterThan(0)
  })

  it('renders an accessible unknown-route state without mutating history during render', () => {
    window.history.replaceState({}, '', '/missing-page?x=1#bad')
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/missing-page')
  })

  it('renders Georgian unknown-route copy when requested safely', () => {
    window.history.replaceState({}, '', '/missing-page?lang=ka')
    render(<App />)
    expect(screen.getByRole('heading', { name: 'გვერდი ვერ მოიძებნა' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'BetaReal-ის მთავარ გვერდზე გადასვლა' })).toHaveAttribute('href', '/')
    expect(document.documentElement).toHaveAttribute('lang', 'ka')
  })

  it('removes the standalone technology section and dead navigation link', async () => {
    render(<FlagshipPage />)
    expect(document.getElementById('technology')).toBeNull()
    expect(screen.queryByRole('heading', { name: 'ONE DISH. THREE WAYS TO EXPERIENCE IT.' })).not.toBeInTheDocument()
    expect(screen.queryByRole('tablist', { name: 'Technology states' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '3D & AR' })).not.toBeInTheDocument()
  })

  it('localizes representative Georgian accessible names and contact facts', async () => {
    window.history.replaceState({}, '', '/?restaurant=Demo%20Bistro')
    render(<FlagshipPage />)
    await userEvent.click(screen.getByRole('button', { name: 'KA' }))
    expect(screen.getByRole('navigation', { name: 'ძირითადი ნავიგაცია' })).toBeInTheDocument()
    expect(screen.getByText('ერთი კერძი. დაგემოვნებამდე მისი გაცნობის სამი გზა.')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'აირჩიეთ' })).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'პერსონალიზებული ნიმუში' })).toBeInTheDocument()
    expect(screen.getAllByText('თქვენი რესტორანი').length).toBeGreaterThan(0)
    expect(screen.queryByText('YourRestaurant')).not.toBeInTheDocument()
    expect(screen.getAllByLabelText('მენიუს კატეგორიები').length).toBeGreaterThan(0)
    expect(screen.queryByLabelText('Preview categories')).not.toBeInTheDocument()
    expect(screen.getByLabelText('ბიგბურგერი ინტერაქტიული 3D ნიმუში')).toBeInTheDocument()
    expect(screen.getAllByLabelText('შოკოლადის კრუასანი ინტერაქტიული 3D მინიატურა').length).toBeGreaterThan(0)
    expect(screen.queryByLabelText(/interactive 3D thumbnail/i)).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: '3D-ში ნახვა: შოკოლადის კრუასანი' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: 'მაგიდაზე განთავსება AR-ით: შოკოლადის კრუასანი' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: '+995 593 19 17 07' })[0]).toHaveAttribute('href', `tel:${PRIMARY_PHONE_E164}`)
    expect(screen.getByRole('link', { name: '+995 599 00 03 05' })).toHaveAttribute('href', `tel:${SECONDARY_PHONE_E164}`)
  })

  it('ships static security headers with the expected external allowances', async () => {
    expect(headersText).toContain("frame-ancestors 'none'")
    const sourceHash = extractJsonLdHash(readFileSync('index.html', 'utf8'))
    expect(sourceHash).toBe(`sha256-${createHash('sha256').update(indexHtml.match(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ?? '', 'utf8').digest('base64')}`)
    expect(headersText).toContain(`'${sourceHash}'`)
    expect(headersText.match(/script-src[^;\n]*/)?.[0]).not.toContain("'unsafe-inline'")
    expect(headersText).toContain('X-Frame-Options: DENY')
    expect(headersText).toContain('https://ajax.googleapis.com')
    expect(headersText).toContain('https://pub-3c68559de18f4aee94d127e180937bdd.r2.dev')
    expect(headersText.match(/connect-src[^;\n]*/)?.[0]).toContain('https://www.gstatic.com')
    expect(headersText).toContain('worker-src')
    expect(headersText).toContain('blob:')
    expect(headersText).not.toContain('navigate-to')
    expect(headersText).toContain('Permissions-Policy')
    expect(headersText).toContain('xr-spatial-tracking=(self)')
    expect(headersText).toContain('/assets/index-*.js')
    expect(headersText).toContain('immutable')
    if (existsSync('dist/index.html')) {
      const distHash = extractJsonLdHash(readFileSync('dist/index.html', 'utf8'))
      expect(headersText).toContain(`'${distHash}'`)
      expect(distHash).toBe(sourceHash)
    }
  })

  it('keeps JSON-LD telephone values normalized and unmasked', () => {
    expect(indexHtml).toContain('"telephone": ["+995593191707", "+995599000305"]')
    expect(indexHtml).not.toContain('tel:+995****')
  })
})

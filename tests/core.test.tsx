/// <reference types="node" />
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../src/App'
import { FlagshipPage } from '../src/pages/FlagshipPage'
import { localAssets } from '../src/data/assets'
import { segmentRoutes, segments } from '../src/data/segments'
import { resetAnalyticsDedupeForTests, trackEvent } from '../src/lib/analytics'
import { ensureModelViewerScript, launchModelViewerAR, type ModelViewerARElement } from '../src/lib/modelViewer'
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
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
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
  document.head.querySelectorAll('script[data-betareal-model-viewer]').forEach((script) => script.remove())
  window.history.replaceState({}, '', '/')
  window.dataLayer = []
  resetAnalyticsDedupeForTests()
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
  vi.spyOn(window, 'open').mockImplementation(() => null)
})

describe('segment architecture', () => {
  it('defines all configured routes and hashes', () => {
    expect(segmentRoutes).toEqual(['luxury', 'cafe', 'fast-casual', 'social-dining'])
    expect(segments.map((segment) => segment.id)).toEqual([
      'luxury-dining',
      'modern-cafe',
      'premium-fast-casual',
      'social-dining',
    ])
    expect(segments.every((segment) => segment.items.length >= 3)).toBe(true)
  })

  it('renders all chapter headings from config', () => {
    render(<FlagshipPage />)
    expect(screen.getByRole('heading', { name: 'Fine Dining, Made Interactive.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Fresh Design for Modern Dining.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Fast Food Without Generic Design.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Built for Busy Places.' })).toBeInTheDocument()
  })

  it('uses the official logo and high-resolution Monday Greens luxury dish assets', () => {
    expect(localAssets.logos.official).toContain('/assets/brand/betareal-logo-official.png')
    expect(Object.values(localAssets.logos)).toEqual([localAssets.logos.official])

    const luxury = segments.find((segment) => segment.id === 'luxury-dining')
    expect(luxury?.items.slice(0, 3).map((item) => [item.name.en, item.image])).toEqual([
      ['Beef Stroganoff', expect.stringContaining('/assets/chapters/luxury/dishes/mg-beef-stroganoff.webp')],
      ['Beef Fillet', expect.stringContaining('/assets/chapters/luxury/dishes/mg-beef-fillet.png')],
      ['Gazpacho', expect.stringContaining('/assets/chapters/luxury/dishes/mg-gazpacho.webp')],
    ])
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
    render(<FlagshipPage />)
    await userEvent.click(screen.getByRole('button', { name: 'KA' }))
    expect(screen.getByRole('heading', { name: 'თქვენი მენიუ ეკრანს მიღმა.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /პრემიუმი/ })).toHaveAttribute('href', '#luxury-dining')
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

  it('implements roving keyboard navigation for technology tabs', async () => {
    render(<FlagshipPage />)
    const tablist = screen.getByRole('tablist', { name: 'Technology states' })
    const menu = within(tablist).getByRole('tab', { name: 'Menu View' })
    const model = within(tablist).getByRole('tab', { name: 'Interactive 3D' })
    const ar = within(tablist).getByRole('tab', { name: 'Augmented Reality' })

    menu.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(model).toHaveFocus()
    expect(model).toHaveAttribute('aria-selected', 'true')
    expect(model).toHaveAttribute('aria-controls', 'technology-panel-model')
    await userEvent.keyboard('{End}')
    expect(ar).toHaveFocus()
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'technology-tab-ar')
    expect(screen.getByRole('button', { name: 'View on table' })).toBeInTheDocument()
    await userEvent.keyboard('{Home}')
    expect(menu).toHaveFocus()

    const allTabs = within(tablist).getAllByRole('tab')
    const allPanels = screen.getAllByRole('tabpanel', { hidden: true })
    expect(allPanels).toHaveLength(3)
    for (const tab of allTabs) {
      const panelId = tab.getAttribute('aria-controls')
      const panel = panelId ? document.getElementById(panelId) : null
      expect(panel).toBeInTheDocument()
      expect(panel).toHaveAttribute('aria-labelledby', tab.id)
    }
  })

  it('localizes representative Georgian accessible names and contact facts', async () => {
    window.history.replaceState({}, '', '/?restaurant=Demo%20Bistro')
    render(<FlagshipPage />)
    await userEvent.click(screen.getByRole('button', { name: 'KA' }))
    expect(screen.getByRole('navigation', { name: 'ძირითადი ნავიგაცია' })).toBeInTheDocument()
    expect(screen.getByRole('tablist', { name: 'ტექნოლოგიის მდგომარეობები' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'გაფართოებული რეალობა' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'აირჩიეთ' })).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'პერსონალიზებული პრევიუ' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: '3D ნახვა: შოკოლადის კრუასანი' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: 'AR-ში განთავსება: შოკოლადის კრუასანი' }).length).toBeGreaterThan(0)
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

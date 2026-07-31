import { useCallback, useEffect, useMemo, useState } from 'react'
import { BenefitsSection } from '../components/BenefitsSection'
import { BetaRealFooter } from '../components/BetaRealFooter'
import { BetaRealHeader } from '../components/BetaRealHeader'
import { BetaRealHero } from '../components/BetaRealHero'
import { ContactSection } from '../components/ContactSection'
import { ExperienceChapter } from '../components/ExperienceChapter'
import { ExperienceNavigation } from '../components/ExperienceNavigation'
import { ModalPrimitive } from '../components/ModalPrimitive'
import { ModelExperience } from '../components/ModelExperience'
import { ProcessSection } from '../components/ProcessSection'
import { ProspectBanner } from '../components/ProspectBanner'
import { modelAssets } from '../data/assets'
import { isSegmentRoute, segments, segmentsByHash, segmentsByRoute } from '../data/segments'
import type { PreviewItem, SegmentRoute } from '../data/types'
import { useActiveSection } from '../hooks/useActiveSection'
import { useLanguage } from '../hooks/useLanguage'
import { getTrackingContext, trackEvent } from '../lib/analytics'
import { openQuickLook, supportsQuickLook } from '../lib/modelViewer'
import { sanitizeRestaurantParam } from '../lib/personalization'

interface FlagshipPageProps {
  initialSegment?: SegmentRoute
}

function getInitialQuerySegment() {
  const params = new URLSearchParams(window.location.search)
  const querySegment = params.get('segment')
  return isSegmentRoute(querySegment) ? querySegment : undefined
}

export function FlagshipPage({ initialSegment }: FlagshipPageProps) {
  const { language, setLanguage, t } = useLanguage()
  const [initialActiveSegment] = useState<SegmentRoute | undefined>(() => initialSegment ?? getInitialQuerySegment())
  const { activeSection } = useActiveSection(initialActiveSegment)
  const activeRoute = segmentsByHash[activeSection]?.route
  const [modelItem, setModelItem] = useState<PreviewItem | null>(null)
  const [modelSegment, setModelSegment] = useState<SegmentRoute | undefined>()
  const [arNotice, setArNotice] = useState('')
  const [arRequestKey, setArRequestKey] = useState(0)
  const [browserLocation, setBrowserLocation] = useState(() => ({
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
  }))

  useEffect(() => {
    const updateLocation = () =>
      setBrowserLocation({
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
      })
    window.addEventListener('popstate', updateLocation)
    window.addEventListener('hashchange', updateLocation)
    return () => {
      window.removeEventListener('popstate', updateLocation)
      window.removeEventListener('hashchange', updateLocation)
    }
  }, [])

  const prospect = useMemo(() => {
    const params = new URLSearchParams(browserLocation.search)
    return sanitizeRestaurantParam(params.get('restaurant'))
  }, [browserLocation.search])

  const getModelItem = useCallback((item?: PreviewItem | null): PreviewItem => (
    item?.model
      ? item
      : {
          id: 'shared-burger-model',
          name: { en: modelAssets.burger.name, ka: modelAssets.burger.nameKa },
          description: {
            en: 'Real shared BetaReal burger model.',
            ka: 'რეალური BetaReal ბურგერის საერთო მოდელი.',
          },
          price: '14 ₾',
          category: { en: '3D dish', ka: '3D კერძი' },
          image: modelAssets.burger.poster,
          model: modelAssets.burger,
        }
  ), [])

  const getItemSegment = useCallback(
    (item?: PreviewItem | null) => segments.find((segment) => segment.items.some((candidate) => candidate.id === item?.id))?.route ?? activeRoute,
    [activeRoute],
  )

  const openModel = useCallback((item?: PreviewItem | null) => {
    setArNotice('')
    setArRequestKey(0)
    setModelSegment(getItemSegment(item))
    setModelItem(getModelItem(item))
  }, [getItemSegment, getModelItem])

  const openAR = useCallback(
    (item?: PreviewItem | null) => {
      const target = getModelItem(item)
      const targetSegment = getItemSegment(item)
      if (target.model?.usdz && supportsQuickLook()) {
        trackEvent('ar_button_clicked', { segment: targetSegment, ...getTrackingContext() })
        openQuickLook(target.model.usdz)
        return
      }
      setArNotice('')
      setModelSegment(targetSegment)
      setModelItem(target)
      setArRequestKey((current) => current + 1)
    },
    [getItemSegment, getModelItem],
  )

  useEffect(() => {
    document.body.classList.toggle('modal-open', Boolean(modelItem))
    return () => document.body.classList.remove('modal-open')
  }, [modelItem])

  useEffect(() => {
    const params = new URLSearchParams(browserLocation.search)
    const querySegment = params.get('segment')
    const target = isSegmentRoute(querySegment) ? segmentsByRoute[querySegment].id : initialSegment ? segmentsByRoute[initialSegment].id : null
    const hashTarget = browserLocation.hash.replace('#', '')
    const id = hashTarget && segmentsByHash[hashTarget] ? hashTarget : target
    if (!id) return

    const frame = window.setTimeout(() => {
      const element = document.getElementById(id)
      element?.scrollIntoView({ block: 'start', behavior: hashTarget ? 'smooth' : 'auto' })
      if (element instanceof HTMLElement) element.focus({ preventScroll: true })
    }, 120)
    return () => window.clearTimeout(frame)
  }, [browserLocation.hash, browserLocation.search, initialSegment])

  useEffect(() => {
    if (!initialSegment) return
    const id = segmentsByRoute[initialSegment].id
    if (browserLocation.hash === `#${id}`) return
    window.history.replaceState({}, '', `${browserLocation.pathname}${browserLocation.search}#${id}`)
  }, [browserLocation.hash, browserLocation.pathname, browserLocation.search, initialSegment])

  return (
    <>
      <a className="skip-link" href="#main">
        {t.nav.skip}
      </a>
      <BetaRealHeader language={language} setLanguage={setLanguage} nav={t.nav} />
      <main id="main">
        <BetaRealHero language={language} text={t.hero} onModelOpen={() => openModel()} />
        <ExperienceNavigation language={language} activeSection={activeSection} label={t.nav.experiencesLabel} />
        {segments.map((segment) => (
          <ExperienceChapter
            key={segment.id}
            segment={segment}
            language={language}
            labels={t.demo}
            onModelOpen={openModel}
            onAROpen={openAR}
          />
        ))}
        <BenefitsSection language={language} title={t.benefits.title} items={t.benefits.items} />
        <ProcessSection language={language} title={t.process.title} steps={t.process.steps} />
        <ContactSection language={language} text={t.contact} activeSegment={activeRoute} prospect={prospect} />
      </main>
      <BetaRealFooter line={t.footer.line} />
      <ProspectBanner restaurant={prospect} language={language} copy={t.prospect} />
      <ModalPrimitive
        isOpen={Boolean(modelItem)}
        title={language === 'ka' ? '3D და AR გამოცდილება' : '3D and AR experience'}
        onClose={() => {
          setModelItem(null)
          setModelSegment(undefined)
          setArRequestKey(0)
        }}
        labelledBy="model-modal-title"
        closeLabel={t.model.close}
      >
        {modelItem?.model ? (
          <div style={{ padding: 14 }}>
            <h2 id="model-modal-title" style={{ margin: '0 0 12px', fontSize: 'clamp(1.8rem, 4vw, 3.2rem)', lineHeight: 1 }}>
              {modelItem.name[language]}
            </h2>
            {arNotice ? <p style={{ color: 'var(--secondary)', margin: '0 0 14px' }}>{arNotice}</p> : null}
            <ModelExperience
              model={modelItem.model}
              language={language}
              segment={modelSegment}
              active
              arRequestKey={arRequestKey}
              onARFallback={() => setArNotice(t.model.arUnsupported)}
              fallbackDemoUrl={modelSegment ? segmentsByRoute[modelSegment].demoUrl : undefined}
              fallbackDemoLabel={t.demo.openFull}
            />
          </div>
        ) : null}
      </ModalPrimitive>
    </>
  )
}

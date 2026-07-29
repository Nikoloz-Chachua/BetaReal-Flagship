import { ExternalLink } from 'lucide-react'
import type { Language, PreviewItem, SegmentConfig } from '../data/types'
import { getTrackingContext, trackEvent } from '../lib/analytics'
import { DemoPreview } from './DemoPreview'
import styles from './ExperienceChapter.module.css'

interface ExperienceChapterProps {
  segment: SegmentConfig
  language: Language
  labels: {
    openFull: string
    view3d: string
    viewAr: string
    details: string
    menu: string
    illustrative: string
    external: string
  }
  onModelOpen: (item: PreviewItem) => void
  onAROpen: (item: PreviewItem) => void
}

export function ExperienceChapter({ segment, language, labels, onModelOpen, onAROpen }: ExperienceChapterProps) {
  const vars = {
    '--chapter-bg': segment.theme.background,
    '--chapter-surface': segment.theme.surface,
    '--chapter-ink': segment.theme.ink,
    '--chapter-muted': segment.theme.muted,
    '--chapter-accent': segment.theme.accent,
    '--chapter-accent-light': segment.theme.accent2,
    '--chapter-accent-strong': segment.theme.accent3,
  } as React.CSSProperties

  return (
    <section
      id={segment.id}
      className={`${styles.chapter} ${styles[segment.theme.fontClass]} ${styles[segment.theme.layout]}`}
      style={vars}
      aria-labelledby={`${segment.id}-title`}
    >
      <div className={styles.inner}>
        <div className={styles.story} data-testid={`${segment.id}-story`}>
          <p className={styles.kicker}>{segment.kicker[language]}</p>
          <h2 id={`${segment.id}-title`}>{segment.heading[language]}</h2>
          <p className={styles.body}>{segment.body[language]}</p>
          <p className={styles.concept}>{segment.conceptLabel[language]}</p>
          {segment.verifiedClientNote ? <p className={styles.note}>{segment.verifiedClientNote[language]}</p> : null}
          <div className={styles.actions}>
            <a
              href={segment.demoUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() =>
                trackEvent('full_demo_opened', {
                  segment: segment.route,
                  demo: segment.demoUrl,
                  ...getTrackingContext(),
                })
              }
            >
              <span>{segment.primaryCta[language]}</span>
              <ExternalLink size={17} aria-hidden="true" />
              <span className="sr-only">({labels.external})</span>
            </a>
            <button type="button" onClick={() => onModelOpen(segment.items.find((item) => item.model) ?? segment.items[0])}>
              {segment.secondaryCta[language]}
            </button>
          </div>
        </div>
        <div className={styles.media} data-testid={`${segment.id}-media`}>
          <img src={segment.images.hero} alt="" loading="lazy" width="1125" height="822" />
          {segment.images.support ? <img src={segment.images.support} alt="" loading="lazy" width="900" height="675" /> : null}
        </div>
        <div className={styles.demo} data-testid={`${segment.id}-demo`}>
          <DemoPreview
            segment={segment}
            language={language}
            labels={labels}
            onModelOpen={onModelOpen}
            onAROpen={onAROpen}
          />
        </div>
      </div>
    </section>
  )
}

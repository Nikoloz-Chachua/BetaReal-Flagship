import { ArrowDown, Rotate3D } from 'lucide-react'
import { modelAssets } from '../data/assets'
import type { Language } from '../data/types'
import { getTrackingContext, trackEvent } from '../lib/analytics'
import { InlineModelThumbnail } from './InlineModelThumbnail'
import styles from './BetaRealHero.module.css'

interface BetaRealHeroProps {
  language: Language
  text: {
    label: string
    line: string
    title: string
    body: string
    explore: string
    view3d: string
    phoneTitle: string
    phoneCategory: string
    visualLabel: string
  }
  onModelOpen: () => void
}

export function BetaRealHero({ language, text, onModelOpen }: BetaRealHeroProps) {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.copy}>
        <p className={styles.eyebrow}>{text.label}</p>
        <h1 id="hero-title">{text.title}</h1>
        <p className={styles.body}>{text.body}</p>
        <div className={styles.ctas}>
          <a className={styles.primary} href="#experiences">
            <ArrowDown size={18} aria-hidden="true" />
            <span>{text.explore}</span>
          </a>
          <button
            className={styles.secondary}
            type="button"
            onClick={() => {
              trackEvent('model_viewer_started', getTrackingContext())
              onModelOpen()
            }}
          >
            <Rotate3D size={18} aria-hidden="true" />
            <span>{text.view3d}</span>
          </button>
        </div>
        <p className={styles.line}>{text.line}</p>
      </div>
      <div className={styles.visual} aria-label={text.visualLabel}>
        <div className={styles.phone} data-testid="hero-phone">
          <div className={styles.phoneTop} />
          <p className={styles.phoneCategory}>{text.phoneCategory}</p>
          <InlineModelThumbnail
            model={modelAssets.burger}
            itemId="hero-bigburger"
            label={language === 'ka' ? modelAssets.burger.nameKa : modelAssets.burger.name}
            language={language}
            className={styles.phoneModelFrame}
            ariaLabel={
              language === 'ka'
                ? `${modelAssets.burger.nameKa} ინტერაქტიული 3D პრევიუ`
                : `${modelAssets.burger.name} interactive 3D preview`
            }
          />
          <h2>{text.phoneTitle}</h2>
          <p>{language === 'ka' ? '3D ნახვა · AR მაგიდაზე' : 'Inspect in 3D · place on table'}</p>
          <div className={styles.phoneActions}>
            <span>3D</span>
            <span>AR</span>
          </div>
        </div>
      </div>
    </section>
  )
}

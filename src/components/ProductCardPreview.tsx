import { Box, ScanLine } from 'lucide-react'
import type { Language, PreviewItem, SegmentRoute } from '../data/types'
import { InlineModelThumbnail } from './InlineModelThumbnail'
import styles from './DemoPreview.module.css'

interface ProductCardPreviewProps {
  item: PreviewItem
  language: Language
  segment?: SegmentRoute
  labels: {
    view3d: string
    viewAr: string
  }
  onModel: (item: PreviewItem) => void
  onAR: (item: PreviewItem) => void
}

export function ProductCardPreview({ item, language, segment, labels, onModel, onAR }: ProductCardPreviewProps) {
  const modelLabel = language === 'ka' ? item.name.ka : item.name.en

  return (
    <article className={styles.card}>
      {item.model ? (
        <InlineModelThumbnail
          model={item.model}
          itemId={item.id}
          label={item.name[language]}
          language={language}
          segment={segment}
        />
      ) : (
        <div className={styles.imageFrame}>
          <img src={item.image} alt={item.name[language]} loading="lazy" width="900" height="675" />
        </div>
      )}
      <div className={styles.cardBody}>
        <div className={styles.cardTop}>
          <p>{item.category[language]}</p>
          <strong>{item.price}</strong>
        </div>
        <h3>{item.name[language]}</h3>
        <p>{item.description[language]}</p>
        {item.badge ? <span className={styles.badge}>{item.badge[language]}</span> : null}
        {item.model ? (
          <div className={styles.cardActions} data-has-model="true">
            <>
              <button type="button" onClick={() => onModel(item)} aria-label={`${labels.view3d}: ${modelLabel}`}>
                <Box size={18} aria-hidden="true" />
                <span>3D</span>
              </button>
              <button type="button" onClick={() => onAR(item)} aria-label={`${labels.viewAr}: ${modelLabel}`}>
                <ScanLine size={18} aria-hidden="true" />
                <span>AR</span>
              </button>
            </>
          </div>
        ) : null}
      </div>
    </article>
  )
}

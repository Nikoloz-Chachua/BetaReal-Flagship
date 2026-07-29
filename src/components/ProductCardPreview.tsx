import { Box, Plus, ScanLine } from 'lucide-react'
import type { Language, PreviewItem } from '../data/types'
import styles from './DemoPreview.module.css'

interface ProductCardPreviewProps {
  item: PreviewItem
  language: Language
  labels: {
    view3d: string
    viewAr: string
    details: string
  }
  onDetails: (item: PreviewItem) => void
  onModel: (item: PreviewItem) => void
  onAR: (item: PreviewItem) => void
}

export function ProductCardPreview({ item, language, labels, onDetails, onModel, onAR }: ProductCardPreviewProps) {
  const modelLabel = language === 'ka' ? item.name.ka : item.name.en

  return (
    <article className={styles.card}>
      <button className={styles.imageButton} type="button" onClick={() => onDetails(item)} aria-label={`${labels.details}: ${item.name[language]}`}>
        <img src={item.image} alt={item.name[language]} loading="lazy" width="900" height="675" />
      </button>
      <div className={styles.cardBody}>
        <div className={styles.cardTop}>
          <p>{item.category[language]}</p>
          <strong>{item.price}</strong>
        </div>
        <h3>{item.name[language]}</h3>
        <p>{item.description[language]}</p>
        {item.badge ? <span className={styles.badge}>{item.badge[language]}</span> : null}
        <div className={styles.cardActions} data-has-model={Boolean(item.model)}>
          <button type="button" onClick={() => onDetails(item)} aria-label={`${labels.details}: ${item.name[language]}`}>
            <Plus size={18} aria-hidden="true" />
          </button>
          {item.model ? (
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
          ) : null}
        </div>
      </div>
    </article>
  )
}

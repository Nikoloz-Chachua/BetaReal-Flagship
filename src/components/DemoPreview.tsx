import { ExternalLink } from 'lucide-react'
import type { Language, PreviewItem, SegmentConfig } from '../data/types'
import { getTrackingContext, trackEvent } from '../lib/analytics'
import { RestaurantHeaderPreview } from './RestaurantHeaderPreview'
import { CategoryPreview } from './CategoryPreview'
import { ProductCardPreview } from './ProductCardPreview'
import styles from './DemoPreview.module.css'

interface DemoPreviewProps {
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

export function DemoPreview({ segment, language, labels, onModelOpen, onAROpen }: DemoPreviewProps) {
  return (
    <div className={styles.preview} data-layout={segment.theme.layout}>
      <RestaurantHeaderPreview segment={segment} language={language} />
      <CategoryPreview categories={segment.categories} language={language} />
      <div className={styles.grid} data-layout={segment.theme.layout} data-testid={`${segment.id}-preview-grid`}>
        {segment.items.map((item) => (
          <ProductCardPreview
            key={item.id}
            item={item}
            language={language}
            segment={segment.route}
            labels={labels}
            onModel={onModelOpen}
            onAR={onAROpen}
          />
        ))}
      </div>
      <div className={styles.previewFooter}>
        <p>{labels.illustrative}</p>
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
          <span>{labels.openFull}</span>
          <ExternalLink size={16} aria-hidden="true" />
          <span className="sr-only">({labels.external})</span>
        </a>
      </div>

    </div>
  )
}

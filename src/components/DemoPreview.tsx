import { ExternalLink } from 'lucide-react'
import { useState } from 'react'
import type { Language, PreviewItem, SegmentConfig } from '../data/types'
import { getTrackingContext, trackEvent } from '../lib/analytics'
import { ModalPrimitive } from './ModalPrimitive'
import { ModelExperience } from './ModelExperience'
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
  const [selected, setSelected] = useState<PreviewItem | null>(null)

  return (
    <div className={styles.preview}>
      <RestaurantHeaderPreview segment={segment} language={language} />
      <CategoryPreview categories={segment.categories} language={language} />
      <div className={styles.grid} data-layout={segment.theme.layout}>
        {segment.items.map((item) => (
          <ProductCardPreview
            key={item.id}
            item={item}
            language={language}
            segment={segment.route}
            labels={labels}
            onDetails={setSelected}
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
      <ModalPrimitive
        title={labels.details}
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        labelledBy="product-detail-title"
        closeLabel={language === 'ka' ? 'დახურვა' : 'Close'}
      >
        {selected ? (
          <div className={styles.detail}>
            <img src={selected.image} alt="" width="900" height="675" />
            <div>
              <p className={styles.detailCategory}>{selected.category[language]}</p>
              <h3 id="product-detail-title">{selected.name[language]}</h3>
              <p>{selected.description[language]}</p>
              <strong>{selected.price}</strong>
              {selected.model ? (
                <ModelExperience model={selected.model} language={language} segment={segment.route} active={false} />
              ) : null}
            </div>
          </div>
        ) : null}
      </ModalPrimitive>
    </div>
  )
}

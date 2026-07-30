import { Search, ShoppingBag } from 'lucide-react'
import type { Language, SegmentConfig } from '../data/types'
import styles from './DemoPreview.module.css'

export function RestaurantHeaderPreview({ segment, language }: { segment: SegmentConfig; language: Language }) {
  return (
    <div className={styles.restaurantHeader}>
      <div>
        <p>{segment.conceptLabel[language]}</p>
        <strong>{language === 'ka' ? 'თქვენი რესტორანი' : 'YourRestaurant'}</strong>
      </div>
      <div className={styles.headerIcons} aria-hidden="true">
        <Search size={18} />
        <ShoppingBag size={18} />
      </div>
    </div>
  )
}

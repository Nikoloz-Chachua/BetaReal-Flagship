import type { Language, LocalizedText } from '../data/types'
import styles from './DemoPreview.module.css'

export function CategoryPreview({ categories, language }: { categories: LocalizedText[]; language: Language }) {
  return (
    <div className={styles.categories} aria-label="Preview categories">
      {categories.map((category, index) => (
        <button type="button" aria-pressed={index === 0} key={category.en}>
          {category[language]}
        </button>
      ))}
    </div>
  )
}

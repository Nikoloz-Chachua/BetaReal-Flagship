import type { Language, LocalizedText } from '../data/types'
import styles from './DemoPreview.module.css'

export function CategoryPreview({ categories, language }: { categories: LocalizedText[]; language: Language }) {
  return (
    <div className={styles.categories} aria-label={language === 'ka' ? 'მენიუს კატეგორიები' : 'Preview categories'}>
      {categories.map((category, index) => (
        <span data-active={index === 0} key={category.en}>
          {category[language]}
        </span>
      ))}
    </div>
  )
}

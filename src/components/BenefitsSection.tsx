import { BadgeCheck, Boxes, Eye, Layers, Palette, Smartphone } from 'lucide-react'
import type { Language } from '../data/types'
import styles from './InfoSections.module.css'

const icons = [Palette, Eye, Smartphone, Layers, Boxes, BadgeCheck]

export function BenefitsSection({ title, items }: { language: Language; title: string; items: readonly (readonly [string, string])[] }) {
  return (
    <section className={styles.section} aria-labelledby="benefits-title">
      <div className={styles.inner}>
        <h2 id="benefits-title">{title}</h2>
        <div className={styles.benefits}>
          {items.map(([heading, body], index) => {
            const Icon = icons[index] ?? BadgeCheck
            return (
              <article key={heading}>
                <Icon size={22} aria-hidden="true" />
                <h3>{heading}</h3>
                <p>{body}</p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

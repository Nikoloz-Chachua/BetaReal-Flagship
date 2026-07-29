import type { Language } from '../data/types'
import styles from './InfoSections.module.css'

export function ProcessSection({ title, steps }: { language: Language; title: string; steps: readonly (readonly [string, string])[] }) {
  return (
    <section className={styles.section} id="process" aria-labelledby="process-title">
      <div className={styles.inner}>
        <h2 id="process-title">{title}</h2>
        <div className={styles.process}>
          {steps.map(([heading, body], index) => (
            <article key={heading}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{heading}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

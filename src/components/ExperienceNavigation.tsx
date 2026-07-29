import type { Language, SegmentHash } from '../data/types'
import { segments } from '../data/segments'
import styles from './ExperienceNavigation.module.css'

interface ExperienceNavigationProps {
  language: Language
  activeSection: SegmentHash
  label: string
}

export function ExperienceNavigation({ language, activeSection, label }: ExperienceNavigationProps) {
  return (
    <nav className={styles.nav} aria-label={label} id="experiences">
      <div className={styles.scroller}>
        {segments.map((segment) => (
          <a
            key={segment.id}
            href={`#${segment.id}`}
            className={activeSection === segment.id ? styles.active : undefined}
            aria-current={activeSection === segment.id ? 'true' : undefined}
          >
            {segment.shortLabel[language]}
          </a>
        ))}
      </div>
    </nav>
  )
}

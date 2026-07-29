import type { Language, SegmentRoute } from '../data/types'
import { LeadForm } from './LeadForm'
import styles from './ContactSection.module.css'

interface ContactSectionProps {
  language: Language
  text: {
    eyebrow: string
    title: string
    body: string
    restaurant: string
    person: string
    contact: string
    category: string
    existing: string
    message: string
    consent: string
    submit: string
    email: string
    direct: string
    success: string
    blocked: string
    fallback: string
    required: string
    contactError: string
    consentError: string
    invalidChars: string
    selectPlaceholder: string
  }
  activeSegment?: SegmentRoute
  prospect?: string | null
}

export function ContactSection({ language, text, activeSegment, prospect }: ContactSectionProps) {
  return (
    <section className={styles.section} id="contact" aria-labelledby="contact-title">
      <div className={styles.inner}>
        <div className={styles.copy}>
          <p>{text.eyebrow}</p>
          <h2 id="contact-title">{text.title}</h2>
          <span>{text.body}</span>
        </div>
        <LeadForm language={language} text={text} activeSegment={activeSegment} prospect={prospect} />
      </div>
    </section>
  )
}

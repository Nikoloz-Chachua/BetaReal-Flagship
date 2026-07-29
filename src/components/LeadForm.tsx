import { Mail, Phone, Send } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { segments } from '../data/segments'
import type { Language, SegmentRoute } from '../data/types'
import { getTrackingContext, trackEvent } from '../lib/analytics'
import {
  buildLeadMessage,
  buildMailtoUrl,
  buildWhatsAppUrl,
  boundLeadInput,
  PRIMARY_PHONE_E164,
  sanitizeLeadState,
  SECONDARY_PHONE_E164,
} from '../lib/leadLinks'
import styles from './LeadForm.module.css'

interface LeadFormProps {
  language: Language
  text: {
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

interface LeadFormState {
  restaurant: string
  person: string
  contact: string
  category: SegmentRoute | ''
  existing: string
  message: string
  consent: boolean
  website: string
}

type LeadErrors = Partial<Record<keyof LeadFormState, string>>

const initialState: LeadFormState = {
  restaurant: '',
  person: '',
  contact: '',
  category: '',
  existing: '',
  message: '',
  consent: false,
  website: '',
}

const fieldIds = {
  restaurant: 'lead-restaurant',
  person: 'lead-person',
  contact: 'lead-contact',
  category: 'lead-category',
  existing: 'lead-existing',
  message: 'lead-message',
  consent: 'lead-consent',
} as const

const fieldLimits = {
  restaurant: 80,
  person: 80,
  contact: 120,
  existing: 160,
  message: 500,
} as const

const multilineFields = new Set<keyof LeadFormState>(['message'])

function isContact(value: string) {
  return /@/.test(value) ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) : /[0-9+() -]{6,}/.test(value)
}

function hasControlChars(value: string) {
  return Array.from(value).some((char) => {
    const code = char.codePointAt(0) ?? 0
    return code <= 31 || code === 127
  })
}

function describe(errorKey: keyof typeof fieldIds, error?: string) {
  return error ? `${fieldIds[errorKey]}-error lead-error-summary` : undefined
}

export function LeadForm({ language, text, activeSegment, prospect }: LeadFormProps) {
  const [state, setState] = useState<LeadFormState>(() => ({ ...initialState, category: activeSegment ?? '' }))
  const [errors, setErrors] = useState<LeadErrors>({})
  const [started, setStarted] = useState(false)
  const [status, setStatus] = useState('')
  const [whatsAppFallbackUrl, setWhatsAppFallbackUrl] = useState('')
  const context = useMemo(() => getTrackingContext(), [])
  const restaurantRef = useRef<HTMLInputElement>(null)
  const personRef = useRef<HTMLInputElement>(null)
  const contactRef = useRef<HTMLInputElement>(null)
  const categoryRef = useRef<HTMLSelectElement>(null)
  const existingRef = useRef<HTMLInputElement>(null)
  const messageRef = useRef<HTMLTextAreaElement>(null)
  const consentRef = useRef<HTMLInputElement>(null)

  function update<K extends keyof LeadFormState>(key: K, value: LeadFormState[K]) {
    const boundedValue =
      typeof value === 'string' && key in fieldLimits
        ? boundLeadInput(value, fieldLimits[key as keyof typeof fieldLimits], multilineFields.has(key))
        : value
    setState((current) => ({ ...current, [key]: boundedValue as LeadFormState[K] }))
    setStatus('')
    setWhatsAppFallbackUrl('')
    if (!started) {
      setStarted(true)
      trackEvent('contact_form_started', { segment: activeSegment, ...context })
    }
  }

  function validate() {
    const next: LeadErrors = {}
    const safeState = sanitizeLeadState(state)
    if (!safeState.restaurant) next.restaurant = hasControlChars(state.restaurant) ? text.invalidChars : text.required
    if (!safeState.person) next.person = hasControlChars(state.person) ? text.invalidChars : text.required
    if (!safeState.contact || !isContact(safeState.contact)) next.contact = hasControlChars(state.contact) ? text.invalidChars : text.contactError
    if (!state.category) next.category = text.required
    if (!state.consent) next.consent = text.consentError
    if (state.website.trim()) next.website = text.required
    if (state.existing && !safeState.existing) next.existing = text.invalidChars
    if (state.message && !safeState.message) next.message = text.invalidChars
    setErrors(next)
    return next
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validate()
    const focusTargets = {
      restaurant: restaurantRef,
      person: personRef,
      contact: contactRef,
      category: categoryRef,
      existing: existingRef,
      message: messageRef,
      consent: consentRef,
    }
    const firstError = Object.keys(nextErrors).find((key): key is keyof typeof focusTargets => key in focusTargets)
    if (firstError) {
      focusTargets[firstError].current?.focus()
      return
    }
    const safeState = sanitizeLeadState(state)
    const message = buildLeadMessage(safeState, { ...context, prospect })
    const whatsAppUrl = buildWhatsAppUrl(message)
    trackEvent('contact_form_submitted', { segment: state.category || activeSegment, ...context })
    const handle = window.open('', '_blank')
    if (!handle) {
      setStatus(text.blocked)
      setWhatsAppFallbackUrl(whatsAppUrl)
      return
    }

    try {
      handle.opener = null
    } catch {
      // Some browsers expose a readonly popup proxy; navigation below still uses the opened handle.
    }

    try {
      if (typeof handle.location?.replace === 'function') {
        handle.location.replace(whatsAppUrl)
      } else {
        handle.location.href = whatsAppUrl
      }
      setStatus(text.success)
      setWhatsAppFallbackUrl('')
      return
    } catch {
      try {
        handle.close()
      } catch {
        // Closing is best-effort after failed popup navigation.
      }
    }
    setStatus(text.blocked)
    setWhatsAppFallbackUrl(whatsAppUrl)
  }

  const preparedMessage = buildLeadMessage(state, { ...context, prospect })

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <div className={styles.honeypot} aria-hidden="true">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={state.website} onChange={(event) => update('website', event.target.value)} />
        </label>
      </div>
      <div className={styles.grid}>
        <Field id={fieldIds.restaurant} label={text.restaurant} error={errors.restaurant}>
          <input
            id={fieldIds.restaurant}
            ref={restaurantRef}
            aria-label={text.restaurant}
            value={state.restaurant}
            onChange={(event) => update('restaurant', event.target.value)}
            autoComplete="organization"
            maxLength={fieldLimits.restaurant}
            aria-invalid={Boolean(errors.restaurant)}
            aria-describedby={describe('restaurant', errors.restaurant)}
          />
        </Field>
        <Field id={fieldIds.person} label={text.person} error={errors.person}>
          <input
            id={fieldIds.person}
            ref={personRef}
            aria-label={text.person}
            value={state.person}
            onChange={(event) => update('person', event.target.value)}
            autoComplete="name"
            maxLength={fieldLimits.person}
            aria-invalid={Boolean(errors.person)}
            aria-describedby={describe('person', errors.person)}
          />
        </Field>
        <Field id={fieldIds.contact} label={text.contact} error={errors.contact}>
          <input
            id={fieldIds.contact}
            ref={contactRef}
            aria-label={text.contact}
            value={state.contact}
            onChange={(event) => update('contact', event.target.value)}
            inputMode="text"
            maxLength={fieldLimits.contact}
            aria-invalid={Boolean(errors.contact)}
            aria-describedby={describe('contact', errors.contact)}
          />
        </Field>
        <Field id={fieldIds.category} label={text.category} error={errors.category}>
          <select
            id={fieldIds.category}
            ref={categoryRef}
            aria-label={text.category}
            value={state.category}
            onChange={(event) => update('category', event.target.value as SegmentRoute)}
            aria-invalid={Boolean(errors.category)}
            aria-describedby={describe('category', errors.category)}
          >
            <option value="">{text.selectPlaceholder}</option>
            {segments.map((segment) => (
              <option key={segment.route} value={segment.route}>
                {segment.label[language]}
              </option>
            ))}
          </select>
        </Field>
        <Field id={fieldIds.existing} label={text.existing} error={errors.existing}>
          <input
            id={fieldIds.existing}
            ref={existingRef}
            aria-label={text.existing}
            value={state.existing}
            onChange={(event) => update('existing', event.target.value)}
            autoComplete="url"
            maxLength={fieldLimits.existing}
            aria-invalid={Boolean(errors.existing)}
            aria-describedby={describe('existing', errors.existing)}
          />
        </Field>
        <Field id={fieldIds.message} label={text.message} error={errors.message} wide>
          <textarea
            id={fieldIds.message}
            ref={messageRef}
            aria-label={text.message}
            value={state.message}
            onChange={(event) => update('message', event.target.value)}
            maxLength={fieldLimits.message}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={describe('message', errors.message)}
            rows={4}
          />
        </Field>
      </div>
      <label className={styles.consent}>
        <input
          id={fieldIds.consent}
          ref={consentRef}
          type="checkbox"
          checked={state.consent}
          onChange={(event) => update('consent', event.target.checked)}
          aria-invalid={Boolean(errors.consent)}
          aria-describedby={describe('consent', errors.consent)}
        />
        <span>{text.consent}</span>
      </label>
      {errors.consent ? (
        <p className={styles.error} id={`${fieldIds.consent}-error`}>
          {errors.consent}
        </p>
      ) : null}
      {Object.keys(errors).length > 0 ? (
        <p className={styles.errorSummary} id="lead-error-summary" role="alert" aria-live="assertive">
          {language === 'ka' ? 'გთხოვთ შეამოწმოთ მონიშნული ველები.' : 'Please check the highlighted fields.'}
        </p>
      ) : null}
      <div className={styles.actions}>
        <button type="submit">
          <Send size={18} aria-hidden="true" />
          <span>{text.submit}</span>
        </button>
        <a
          href={buildMailtoUrl(preparedMessage)}
          onClick={() => trackEvent('external_contact_clicked', { segment: state.category || activeSegment, ...context })}
        >
          <Mail size={18} aria-hidden="true" />
          <span>{text.email}</span>
        </a>
      </div>
      {status ? (
        <p className={styles.status} role="status">
          {status}
        </p>
      ) : null}
      {whatsAppFallbackUrl ? (
        <a className={styles.fallback} href={whatsAppFallbackUrl} target="_blank" rel="noopener noreferrer">
          {text.fallback}
        </a>
      ) : null}
      <div className={styles.direct} aria-label={text.direct}>
        <a href={`tel:${PRIMARY_PHONE_E164}`} onClick={() => trackEvent('external_contact_clicked', { ...context })}>
          <Phone size={16} aria-hidden="true" /> +995 593 19 17 07
        </a>
        <a href={`tel:${SECONDARY_PHONE_E164}`} onClick={() => trackEvent('external_contact_clicked', { ...context })}>
          <Phone size={16} aria-hidden="true" /> +995 599 00 03 05
        </a>
      </div>
    </form>
  )
}

function Field({
  id,
  label,
  error,
  wide,
  children,
}: {
  id: string
  label: string
  error?: string
  wide?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`${styles.field} ${wide ? styles.wide : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? <small id={`${id}-error`}>{error}</small> : null}
    </div>
  )
}

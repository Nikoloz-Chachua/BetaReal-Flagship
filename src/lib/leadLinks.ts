import type { SegmentRoute } from '../data/types'
import { sanitizeTrackingParam } from './personalization'

export interface LeadMessageState {
  restaurant: string
  person: string
  contact: string
  category: SegmentRoute | ''
  existing: string
  message: string
}

export const PRIMARY_PHONE_E164 = '+995593191707'
export const SECONDARY_PHONE_E164 = '+995599000305'
export const WHATSAPP_PHONE = PRIMARY_PHONE_E164.replace('+', '')

const FIELD_LIMITS: Record<keyof LeadMessageState, number> = {
  restaurant: 80,
  person: 80,
  contact: 120,
  category: 32,
  existing: 160,
  message: 500,
}

const MAX_LEAD_MESSAGE_LENGTH = 1200

function hasDisallowedControlChars(value: string, allowMultiline = false) {
  return Array.from(value).some((char) => {
    if (allowMultiline && (char === '\n' || char === '\t')) return false
    const code = char.codePointAt(0) ?? 0
    return code <= 31 || code === 127
  })
}

export function boundLeadInput(value: string, maxLength: number, allowMultiline = false) {
  const filtered = Array.from(value).filter((char) => {
    if (allowMultiline && (char === '\n' || char === '\t')) return true
    const code = char.codePointAt(0) ?? 0
    return code > 31 && code !== 127
  })
  return filtered.slice(0, maxLength).join('')
}

export function sanitizeLeadField(value: string, maxLength: number, allowMultiline = false) {
  const normalized = value.normalize('NFKC').trim()
  if (!normalized) return ''
  if (hasDisallowedControlChars(normalized, allowMultiline)) {
    return ''
  }
  return Array.from(normalized).slice(0, maxLength).join('')
}

export function sanitizeLeadState(state: LeadMessageState): LeadMessageState {
  return {
    restaurant: sanitizeLeadField(state.restaurant, FIELD_LIMITS.restaurant),
    person: sanitizeLeadField(state.person, FIELD_LIMITS.person),
    contact: sanitizeLeadField(state.contact, FIELD_LIMITS.contact),
    category: state.category,
    existing: sanitizeLeadField(state.existing, FIELD_LIMITS.existing),
    message: sanitizeLeadField(state.message, FIELD_LIMITS.message, true),
  }
}

export function buildLeadMessage(
  state: LeadMessageState,
  context: { source?: string; campaign?: string; prospect?: string | null },
) {
  const safeState = sanitizeLeadState(state)
  const lines = [
    'BetaReal demo request',
    `Restaurant: ${safeState.restaurant}`,
    `Contact person: ${safeState.person}`,
    `Phone/email: ${safeState.contact}`,
    `Category: ${safeState.category}`,
    safeState.existing ? `Existing site/social: ${safeState.existing}` : '',
    safeState.message ? `Message: ${safeState.message}` : '',
    context.prospect ? `Prospect context: ${context.prospect}` : '',
    sanitizeTrackingParam(context.source) ? `Source: ${sanitizeTrackingParam(context.source)}` : '',
    sanitizeTrackingParam(context.campaign) ? `Campaign: ${sanitizeTrackingParam(context.campaign)}` : '',
  ].filter(Boolean)
  return Array.from(lines.join('\n')).slice(0, MAX_LEAD_MESSAGE_LENGTH).join('')
}

export function buildWhatsAppUrl(message: string) {
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`
}

export function buildMailtoUrl(message: string) {
  return `mailto:betareal.ar@gmail.com?subject=${encodeURIComponent('BetaReal demo request')}&body=${encodeURIComponent(message)}`
}

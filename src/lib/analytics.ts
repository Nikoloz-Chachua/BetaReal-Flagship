import type { SegmentRoute } from '../data/types'
import { sanitizeTrackingParam } from './personalization'

export type AnalyticsEventName =
  | 'experience_section_viewed'
  | 'full_demo_opened'
  | 'model_viewer_started'
  | 'inline_model_thumbnail_interacted'
  | 'ar_button_clicked'
  | 'request_demo_clicked'
  | 'contact_form_started'
  | 'contact_form_submitted'
  | 'external_contact_clicked'

export interface AnalyticsPayload {
  segment?: SegmentRoute
  demo?: string
  item?: string
  source?: string
  campaign?: string
}

declare global {
  interface Window {
    dataLayer?: Array<Record<string, string | undefined>>
  }
}

const viewed = new Set<string>()

export function resetAnalyticsDedupeForTests() {
  viewed.clear()
}

export function trackEvent(name: AnalyticsEventName, payload: AnalyticsPayload = {}) {
  if (name === 'experience_section_viewed' && payload.segment) {
    const key = `${name}:${payload.segment}`
    if (viewed.has(key)) return
    viewed.add(key)
  }

  const safePayload: AnalyticsPayload = {
    segment: payload.segment,
    demo: payload.demo,
    source: sanitizeTrackingParam(payload.source),
    campaign: sanitizeTrackingParam(payload.campaign),
  }
  const item = sanitizeTrackingParam(payload.item)
  if (item) safePayload.item = item
  const eventRecord = { event: name, ...safePayload }
  window.dataLayer?.push(eventRecord)
  window.dispatchEvent(new CustomEvent('betareal:analytics', { detail: eventRecord }))
}

export function getTrackingContext(search = window.location.search): Pick<AnalyticsPayload, 'source' | 'campaign'> {
  const params = new URLSearchParams(search)
  return {
    source: sanitizeTrackingParam(params.get('utm_source') ?? params.get('source')),
    campaign: sanitizeTrackingParam(params.get('utm_campaign')),
  }
}

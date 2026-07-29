import { useEffect, useRef, useState } from 'react'
import { segments } from '../data/segments'
import type { SegmentHash, SegmentRoute } from '../data/types'
import { getTrackingContext, trackEvent } from '../lib/analytics'

export function useActiveSection(initial?: SegmentRoute) {
  const initialHash = initial ? segments.find((segment) => segment.route === initial)?.id : segments[0].id
  const [activeSection, setActiveSection] = useState<SegmentHash>(initialHash ?? segments[0].id)
  const activeRef = useRef<SegmentHash>(initialHash ?? segments[0].id)
  const trackedRef = useRef(new Set<SegmentHash>())

  useEffect(() => {
    let frame = 0
    const current = segments.find((segment) => segment.id === activeRef.current)
    if (current && !trackedRef.current.has(current.id)) {
      trackedRef.current.add(current.id)
      trackEvent('experience_section_viewed', { segment: current.route, ...getTrackingContext() })
    }

    const getStickyOffset = () => {
      const root = document.documentElement
      const headerHeight = Number.parseFloat(getComputedStyle(root).getPropertyValue('--header-height')) || 68
      const experienceNav = document.getElementById('experiences')
      return headerHeight + (experienceNav?.getBoundingClientRect().height ?? 0) + 12
    }

    const updateActive = () => {
      frame = 0
      const stickyOffset = getStickyOffset()
      const candidates = segments
        .map((segment) => {
          const element = document.getElementById(segment.id)
          if (!element) return null
          return {
            segment,
            distance: Math.abs(element.getBoundingClientRect().top - stickyOffset),
          }
        })
        .filter(Boolean) as Array<{ segment: (typeof segments)[number]; distance: number }>

      const nearest = candidates.sort((a, b) => a.distance - b.distance)[0]?.segment
      if (!nearest || nearest.id === activeRef.current) return

      activeRef.current = nearest.id
      setActiveSection(nearest.id)
      if (!trackedRef.current.has(nearest.id)) {
        trackedRef.current.add(nearest.id)
        trackEvent('experience_section_viewed', { segment: nearest.route, ...getTrackingContext() })
      }
    }

    const scheduleUpdate = () => {
      if (frame) return
      frame = window.requestAnimationFrame(updateActive)
    }

    if (!initial) scheduleUpdate()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
    }
  }, [initial])

  return { activeSection, setActiveSection }
}

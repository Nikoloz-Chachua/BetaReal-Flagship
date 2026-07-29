import { ScanLine } from 'lucide-react'
import type { SegmentRoute } from '../data/types'
import { getTrackingContext, trackEvent } from '../lib/analytics'
import { openQuickLook, supportsQuickLook } from '../lib/modelViewer'

interface ARButtonProps {
  usdz: string
  segment?: SegmentRoute
  label: string
  onFallback: () => void
  onUnsupported?: () => void
  className?: string
}

export function ARButton({ usdz, segment, label, onFallback, onUnsupported, className }: ARButtonProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        trackEvent('ar_button_clicked', { segment, ...getTrackingContext() })
        if (supportsQuickLook()) {
          openQuickLook(usdz)
          return
        }
        onUnsupported?.()
        onFallback()
      }}
    >
      <ScanLine size={18} aria-hidden="true" />
      <span>{label}</span>
    </button>
  )
}

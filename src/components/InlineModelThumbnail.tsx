import { Move3D } from 'lucide-react'
import type { SyntheticEvent } from 'react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { Language, ModelAsset, SegmentRoute } from '../data/types'
import { copy } from '../data/i18n'
import { getTrackingContext, trackEvent } from '../lib/analytics'
import { ensureModelViewerScript, MODEL_VIEWER_MAX_CAMERA_ORBIT } from '../lib/modelViewer'
import styles from './DemoPreview.module.css'

interface InlineModelThumbnailProps {
  model: ModelAsset
  itemId: string
  label: string
  language: Language
  segment?: SegmentRoute
  className?: string
  ariaLabel?: string
}

type InlineModelState = 'initial' | 'loading' | 'ready' | 'failure'

function thumbnailCameraFor(model: ModelAsset) {
  const name = model.name.toLowerCase()
  if (name.includes('hot dog')) return { orbit: '25deg 66deg 92%', fov: '26deg' }
  if (name.includes('croissant')) return { orbit: '20deg 68deg 94%', fov: '25deg' }
  return { orbit: '20deg 66deg 96%', fov: '25deg' }
}

export function InlineModelThumbnail({ model, itemId, label, language, segment, className = '', ariaLabel }: InlineModelThumbnailProps) {
  const [hasEnteredViewport, setHasEnteredViewport] = useState(false)
  const [scriptReady, setScriptReady] = useState(false)
  const [state, setState] = useState<InlineModelState>('initial')
  const rootRef = useRef<HTMLDivElement>(null)
  const viewerNodeRef = useRef<HTMLElement | null>(null)
  const interactionTracked = useRef(false)
  const hintId = useId()
  const text = copy[language]
  const compactHint = language === 'ka' ? 'გადაატრიალეთ' : 'Drag to rotate'
  const camera = thumbnailCameraFor(model)

  const beginLoading = useCallback(() => {
    setState((current) => (current === 'ready' ? current : 'loading'))
    setHasEnteredViewport(true)
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root || hasEnteredViewport) return

    if (!('IntersectionObserver' in window)) {
      const timer = globalThis.setTimeout(beginLoading, 0)
      return () => globalThis.clearTimeout(timer)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting || entry.intersectionRatio > 0)) {
          beginLoading()
          observer.disconnect()
        }
      },
      { rootMargin: '360px 0px', threshold: 0.01 },
    )
    observer.observe(root)
    return () => observer.disconnect()
  }, [beginLoading, hasEnteredViewport])

  useEffect(() => {
    if (!hasEnteredViewport) return
    let cancelled = false
    void ensureModelViewerScript().then((ok) => {
      if (cancelled) return
      if (ok) {
        setScriptReady(true)
      } else {
        setState('failure')
      }
    })
    return () => {
      cancelled = true
    }
  }, [hasEnteredViewport])

  const trackFirstInteraction = useCallback(() => {
    if (interactionTracked.current) return
    interactionTracked.current = true
    trackEvent('inline_model_thumbnail_interacted', {
      segment,
      item: itemId,
      ...getTrackingContext(),
    })
  }, [itemId, segment])

  const handleViewerLoad = useCallback(() => {
    setState('ready')
  }, [])

  const handleViewerError = useCallback(() => {
    setState('failure')
  }, [])

  const setViewerRef = useCallback(
    (element: HTMLElement | null) => {
      if (viewerNodeRef.current) {
        viewerNodeRef.current.removeEventListener('load', handleViewerLoad)
        viewerNodeRef.current.removeEventListener('error', handleViewerError)
      }
      viewerNodeRef.current = element
      if (element) {
        element.addEventListener('load', handleViewerLoad)
        element.addEventListener('error', handleViewerError)
      }
    },
    [handleViewerError, handleViewerLoad],
  )

  const stopCardActivation = useCallback((event: SyntheticEvent) => {
    event.stopPropagation()
  }, [])

  return (
    <div
      ref={rootRef}
      className={`${styles.mediaFrame} ${styles.inlineModel} ${styles[`inlineModel-${state}`]} ${className}`.trim()}
      data-inline-model-state={state}
      data-testid={`inline-model-${itemId}`}
      role="group"
      aria-label={ariaLabel ?? `${label} interactive 3D thumbnail`}
      aria-describedby={hintId}
      onClick={stopCardActivation}
      onPointerDown={stopCardActivation}
    >
      <img
        className={styles.inlineModelPoster}
        src={model.poster}
        alt={label}
        loading="lazy"
        width="900"
        height="900"
      />
      {scriptReady ? (
        <model-viewer
          ref={setViewerRef}
          class={styles.inlineModelViewer}
          src={model.glb}
          alt={label}
          camera-controls="true"
          touch-action="pan-y"
          auto-rotate="true"
          disable-tap="true"
          shadow-intensity="1"
          exposure="0.94"
          camera-orbit={camera.orbit}
          max-camera-orbit={MODEL_VIEWER_MAX_CAMERA_ORBIT}
          field-of-view={camera.fov}
          scale={`${model.scale} ${model.scale} ${model.scale}`}
          interaction-prompt="none"
          aria-label={`${label}. ${text.model.hint}`}
          aria-describedby={hintId}
          onPointerDown={trackFirstInteraction}
          onWheel={trackFirstInteraction}
        />
      ) : null}
      <span id={hintId} className={styles.inlineModelHint}>
        <Move3D size={14} aria-hidden="true" />
        <span>{compactHint}</span>
      </span>
    </div>
  )
}

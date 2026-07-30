import { Rotate3D, ScanLine } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ModelAsset, SegmentRoute } from '../data/types'
import { copy } from '../data/i18n'
import type { Language } from '../data/types'
import { getTrackingContext, trackEvent } from '../lib/analytics'
import {
  ensureModelViewerScript,
  launchModelViewerAR,
  MODEL_VIEWER_MAX_CAMERA_ORBIT,
  openQuickLook,
  supportsQuickLook,
  type ModelViewerARElement,
} from '../lib/modelViewer'
import { ErrorState } from './ErrorState'
import { LoadingState } from './LoadingState'
import { UnsupportedARState } from './UnsupportedARState'
import styles from './ModelExperience.module.css'

interface ModelExperienceProps {
  model: ModelAsset
  language: Language
  segment?: SegmentRoute
  active?: boolean
  onStart?: () => void
  arRequestKey?: number
  onARFallback?: () => void
  fallbackDemoUrl?: string
  fallbackDemoLabel?: string
}

export function ModelViewer({
  model,
  language,
  segment,
  active = true,
  onStart,
  arRequestKey,
  onARFallback,
  fallbackDemoUrl,
  fallbackDemoLabel,
}: ModelExperienceProps) {
  const [started, setStarted] = useState(active)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(false)
  const [unsupported, setUnsupported] = useState(false)
  const viewerRef = useRef<ModelViewerARElement>(null)
  const text = copy[language]

  const loadViewer = useCallback(async () => {
    onStart?.()
    trackEvent('model_viewer_started', { segment, ...getTrackingContext() })
    const ok = await ensureModelViewerScript()
    if (!ok) setError(true)
    return ok
  }, [onStart, segment])

  const start = useCallback(async () => {
    setStarted(true)
    setError(false)
    await loadViewer()
  }, [loadViewer])

  const startAR = useCallback(async () => {
    trackEvent('ar_button_clicked', { segment, ...getTrackingContext() })
    if (supportsQuickLook()) {
      openQuickLook(model.usdz)
      return
    }

    setStarted(true)
    setError(false)
    setUnsupported(false)
    const ok = await loadViewer()
    if (!ok) {
      setUnsupported(true)
      onARFallback?.()
      return
    }
    const launched = await launchModelViewerAR(viewerRef.current)
    if (!launched) {
      setUnsupported(true)
      onARFallback?.()
    }
  }, [loadViewer, model.usdz, onARFallback, segment])

  useEffect(() => {
    if (!active || arRequestKey) return
    const timer = window.setTimeout(() => void loadViewer(), 0)
    return () => window.clearTimeout(timer)
  }, [active, arRequestKey, loadViewer])

  useEffect(() => {
    if (!arRequestKey) return
    const timer = window.setTimeout(() => void startAR(), 0)
    return () => window.clearTimeout(timer)
  }, [arRequestKey, startAR])

  if (!started) {
    return (
      <div className={styles.posterOnly}>
        <img src={model.poster} alt={language === 'ka' ? model.nameKa : model.name} loading="lazy" width="900" height="900" />
        <button className={styles.start} type="button" onClick={() => void start()}>
          <Rotate3D size={19} aria-hidden="true" />
          <span>{text.model.start3d}</span>
        </button>
      </div>
    )
  }

  return (
    <div className={styles.viewerWrap}>
      {!ready && !error ? <LoadingState label={text.model.loading} /> : null}
      {error ? (
        <div className={styles.errorAction}>
          <ErrorState label={text.model.error} />
          <button type="button" onClick={() => void start()}>
            {text.model.retry}
          </button>
          {fallbackDemoUrl ? (
            <a href={fallbackDemoUrl} target="_blank" rel="noopener noreferrer">
              {fallbackDemoLabel ?? text.demo.openFull}
            </a>
          ) : null}
        </div>
      ) : null}
      {error ? (
        <img className={styles.errorPoster} src={model.poster} alt={language === 'ka' ? model.nameKa : model.name} width="900" height="900" />
      ) : (
        <model-viewer
          ref={viewerRef}
          className={styles.viewer}
          src={model.glb}
          poster={model.poster}
          ios-src={model.usdz}
          alt={language === 'ka' ? model.nameKa : model.name}
          ar="true"
          ar-modes="quick-look scene-viewer webxr"
          ar-scale="auto"
          scale={`${model.scale} ${model.scale} ${model.scale}`}
          camera-controls="true"
          touch-action="pan-y"
          auto-rotate="true"
          shadow-intensity="1"
          exposure="0.92"
          camera-orbit="20deg 68deg 105%"
          max-camera-orbit={MODEL_VIEWER_MAX_CAMERA_ORBIT}
          interaction-prompt="auto"
          onLoad={() => setReady(true)}
          onError={() => setError(true)}
        />
      )}
      <div className={styles.controls}>
        <p>{text.model.hint}</p>
        <button
          className={styles.arNative}
          type="button"
          onClick={() => void startAR()}
        >
          <ScanLine size={18} aria-hidden="true" />
          <span>{text.model.arCta}</span>
        </button>
      </div>
      {unsupported ? <UnsupportedARState label={text.model.arUnsupported} /> : null}
    </div>
  )
}

export function ModelExperience(props: ModelExperienceProps) {
  return <ModelViewer {...props} />
}

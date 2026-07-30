const MODEL_VIEWER_SRC = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js'
export const MODEL_VIEWER_MAX_CAMERA_ORBIT = 'auto 70deg auto'
let loadPromise: Promise<boolean> | null = null

export function isModelViewerDefined() {
  return Boolean(window.customElements?.get('model-viewer'))
}

export function ensureModelViewerScript(): Promise<boolean> {
  if (isModelViewerDefined()) return Promise.resolve(true)
  if (loadPromise && !document.querySelector<HTMLScriptElement>(`script[src="${MODEL_VIEWER_SRC}"]`)) {
    loadPromise = null
  }
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${MODEL_VIEWER_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => {
        window.customElements.whenDefined('model-viewer').then(() => resolve(true))
      }, { once: true })
      existing.addEventListener('error', () => {
        existing.remove()
        loadPromise = null
        resolve(false)
      }, { once: true })
      return
    }

    const script = document.createElement('script')
    script.type = 'module'
    script.src = MODEL_VIEWER_SRC
    script.dataset.betarealModelViewer = 'true'
    script.addEventListener('load', () => {
      window.customElements.whenDefined('model-viewer').then(() => resolve(true))
    }, { once: true })
    script.addEventListener('error', () => {
      script.remove()
      loadPromise = null
      resolve(false)
    }, { once: true })
    document.head.appendChild(script)
  })

  return loadPromise
}

export function supportsQuickLook() {
  const anchor = document.createElement('a') as HTMLAnchorElement & { relList?: DOMTokenList }
  try {
    return Boolean(anchor.relList?.supports?.('ar'))
  } catch {
    return false
  }
}

export function openQuickLook(usdzUrl: string) {
  const anchor = document.createElement('a')
  anchor.setAttribute('rel', 'ar')
  anchor.href = usdzUrl
  anchor.appendChild(document.createElement('img'))
  document.body.appendChild(anchor)
  anchor.click()
  window.setTimeout(() => anchor.remove(), 1000)
}

export interface ModelViewerARElement extends HTMLElement {
  activateAR?: () => Promise<void> | void
  loaded?: boolean
}

export async function launchModelViewerAR(viewer: ModelViewerARElement | null | undefined) {
  if (!viewer?.activateAR) return false
  try {
    await viewer.activateAR()
    return true
  } catch {
    return false
  }
}

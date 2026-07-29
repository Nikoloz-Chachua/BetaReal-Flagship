/// <reference types="vite/client" />

declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      src?: string
      poster?: string
      alt?: string
      ar?: boolean | string
      'ar-modes'?: string
      'camera-controls'?: boolean | string
      'touch-action'?: string
      'auto-rotate'?: boolean | string
      'shadow-intensity'?: string
      exposure?: string
      'camera-orbit'?: string
      'ios-src'?: string
      'ar-scale'?: string
      scale?: string
      'interaction-prompt'?: string
    }
  }
}

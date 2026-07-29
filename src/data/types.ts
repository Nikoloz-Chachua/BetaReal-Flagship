export type Language = 'en' | 'ka'

export type SegmentRoute = 'luxury' | 'cafe' | 'fast-casual' | 'social-dining'

export type SegmentHash =
  | 'luxury-dining'
  | 'modern-cafe'
  | 'premium-fast-casual'
  | 'social-dining'

export interface LocalizedText {
  en: string
  ka: string
}

export interface ModelAsset {
  name: string
  nameKa: string
  glb: string
  usdz: string
  poster: string
  scale: number
}

export interface PreviewItem {
  id: string
  name: LocalizedText
  description: LocalizedText
  price: string
  category: LocalizedText
  image: string
  model?: ModelAsset
  badge?: LocalizedText
}

export interface SegmentTheme {
  background: string
  surface: string
  ink: string
  muted: string
  accent: string
  accent2: string
  accent3: string
  fontClass: string
  layout: 'editorial' | 'cafe' | 'poster' | 'industrial'
}

export interface SegmentConfig {
  id: SegmentHash
  route: SegmentRoute
  label: LocalizedText
  shortLabel: LocalizedText
  heading: LocalizedText
  kicker: LocalizedText
  conceptLabel: LocalizedText
  body: LocalizedText
  demoUrl: string
  primaryCta: LocalizedText
  secondaryCta: LocalizedText
  categories: LocalizedText[]
  items: PreviewItem[]
  images: {
    hero: string
    support?: string
  }
  theme: SegmentTheme
  verifiedClientNote?: LocalizedText
}

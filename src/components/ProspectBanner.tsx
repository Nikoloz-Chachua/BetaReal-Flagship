import { X } from 'lucide-react'
import { useState } from 'react'
import type { Language } from '../data/types'
import styles from './ProspectBanner.module.css'

interface ProspectBannerProps {
  restaurant: string | null
  language: Language
  copy: {
    copy: string
    dismiss: string
  }
}

export function ProspectBanner({ restaurant, language, copy }: ProspectBannerProps) {
  const [visible, setVisible] = useState(Boolean(restaurant))
  if (!restaurant || !visible) return null

  return (
    <aside className={styles.banner} aria-label={language === 'ka' ? 'პერსონალიზებული ნიმუში' : 'Personalized preview'}>
      <p>
        {copy.copy} <strong>{restaurant}</strong>
      </p>
      <button type="button" onClick={() => setVisible(false)} aria-label={copy.dismiss}>
        <X size={18} aria-hidden="true" />
      </button>
    </aside>
  )
}

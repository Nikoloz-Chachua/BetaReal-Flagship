import { Menu, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { localAssets } from '../data/assets'
import type { Language } from '../data/types'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { getTrackingContext, trackEvent } from '../lib/analytics'
import styles from './BetaRealHeader.module.css'

interface BetaRealHeaderProps {
  language: Language
  setLanguage: (language: Language) => void
  nav: {
    experiences: string
    how: string
    tech: string
    contact: string
    request: string
    menu: string
    close: string
    primary: string
    mobileDialog: string
    language: string
    home: string
  }
}

const links = [
  ['#experiences', 'experiences'],
  ['#process', 'how'],
  ['#technology', 'tech'],
  ['#contact', 'contact'],
] as const

export function BetaRealHeader({ language, setLanguage, nav }: BetaRealHeaderProps) {
  const [open, setOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  useFocusTrap(open, drawerRef, () => setOpen(false))

  useEffect(() => {
    document.body.classList.toggle('drawer-open', open)
    return () => document.body.classList.remove('drawer-open')
  }, [open])

  const navContent = (
    <>
      {links.map(([href, key]) => (
        <a key={href} href={href} onClick={() => setOpen(false)}>
          {nav[key]}
        </a>
      ))}
    </>
  )

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <a className={styles.logoLink} href="/" aria-label={nav.home}>
          <img src={localAssets.logos.dark} width="132" height="34" alt="BetaReal" />
        </a>
        <nav className={styles.desktopNav} aria-label={nav.primary}>
          {navContent}
        </nav>
        <div className={styles.actions}>
          <div className={styles.lang} aria-label={nav.language}>
            <button type="button" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>
              EN
            </button>
            <button type="button" aria-pressed={language === 'ka'} onClick={() => setLanguage('ka')}>
              KA
            </button>
          </div>
          <a
            className={styles.request}
            href="#contact"
            onClick={() => trackEvent('request_demo_clicked', getTrackingContext())}
          >
            {nav.request}
          </a>
          <button className={styles.menuButton} type="button" onClick={() => setOpen(true)} aria-label={nav.menu}>
            <Menu size={22} aria-hidden="true" />
          </button>
        </div>
      </div>
      {open ? (
        <div className={styles.drawerBackdrop} role="presentation" onMouseDown={() => setOpen(false)}>
          <div
            className={styles.drawer}
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={nav.mobileDialog}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={styles.drawerTop}>
              <img src={localAssets.logos.dark} width="120" height="31" alt="BetaReal" />
              <button type="button" onClick={() => setOpen(false)} aria-label={nav.close}>
                <X size={22} aria-hidden="true" />
              </button>
            </div>
            <nav className={styles.drawerNav}>{navContent}</nav>
            <div className={styles.drawerLang}>
              <button type="button" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>
                English
              </button>
              <button type="button" aria-pressed={language === 'ka'} onClick={() => setLanguage('ka')}>
                ქართული
              </button>
            </div>
            <a className={styles.drawerRequest} href="#contact" onClick={() => setOpen(false)}>
              {nav.request}
            </a>
          </div>
        </div>
      ) : null}
    </header>
  )
}

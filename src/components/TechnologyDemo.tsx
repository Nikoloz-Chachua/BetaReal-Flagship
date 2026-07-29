import { Box, ChefHat, ScanLine } from 'lucide-react'
import { useRef, useState } from 'react'
import { modelAssets } from '../data/assets'
import type { Language } from '../data/types'
import { ModelExperience } from './ModelExperience'
import styles from './TechnologyDemo.module.css'

type TechMode = 'menu' | 'model' | 'ar'

interface TechnologyDemoProps {
  language: Language
  text: {
    eyebrow: string
    title: string
    body: string
    menu: string
    model: string
    ar: string
    viewOnTable: string
    tablistLabel: string
    fallback: string
  }
  onAROpen: () => void
}

const tabs: Array<{ mode: TechMode; icon: typeof ChefHat }> = [
  { mode: 'menu', icon: ChefHat },
  { mode: 'model', icon: Box },
  { mode: 'ar', icon: ScanLine },
]

export function TechnologyDemo({ language, text, onAROpen }: TechnologyDemoProps) {
  const [mode, setMode] = useState<TechMode>('menu')
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  const labels = {
    menu: text.menu,
    model: text.model,
    ar: text.ar,
  } satisfies Record<TechMode, string>

  function focusTab(nextIndex: number) {
    const nextMode = tabs[nextIndex]?.mode
    if (!nextMode) return
    tabRefs.current[nextIndex]?.focus()
    setMode(nextMode)
  }

  function onTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      focusTab((index + 1) % tabs.length)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      focusTab((index - 1 + tabs.length) % tabs.length)
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusTab(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      focusTab(tabs.length - 1)
    }
  }

  return (
    <section className={styles.section} id="technology" aria-labelledby="technology-title">
      <div className={styles.inner}>
        <div className={styles.copy}>
          <p>{text.eyebrow}</p>
          <h2 id="technology-title">{text.title}</h2>
          <span>{text.body}</span>
        </div>
        <div className={styles.panel}>
          <div className={styles.tabs} role="tablist" aria-label={text.tablistLabel}>
            {tabs.map(({ mode: tabMode, icon: Icon }, index) => (
              <button
                key={tabMode}
                id={`technology-tab-${tabMode}`}
                ref={(element) => {
                  tabRefs.current[index] = element
                }}
                type="button"
                role="tab"
                aria-selected={mode === tabMode}
                aria-controls={`technology-panel-${tabMode}`}
                tabIndex={mode === tabMode ? 0 : -1}
                onClick={() => setMode(tabMode)}
                onKeyDown={(event) => onTabKeyDown(event, index)}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{labels[tabMode]}</span>
              </button>
            ))}
          </div>
          <div
            className={styles.stage}
            id="technology-panel-menu"
            role="tabpanel"
            aria-labelledby="technology-tab-menu"
            tabIndex={mode === 'menu' ? 0 : -1}
            hidden={mode !== 'menu'}
          >
            <div className={styles.menuState}>
              <img
                src={modelAssets.burger.poster}
                alt={language === 'ka' ? modelAssets.burger.nameKa : modelAssets.burger.name}
                width="900"
                height="900"
              />
              <div>
                <p>{language === 'ka' ? 'მენიუს ბარათი' : 'Menu card'}</p>
                <h3>{language === 'ka' ? modelAssets.burger.nameKa : modelAssets.burger.name}</h3>
                <span>
                  {language === 'ka'
                    ? 'სტუმარი იწყებს სწრაფი პოსტერით და მკაფიო აღწერით.'
                    : 'The guest starts with a fast poster and a clear description.'}
                </span>
              </div>
            </div>
          </div>
          <div
            className={styles.stage}
            id="technology-panel-model"
            role="tabpanel"
            aria-labelledby="technology-tab-model"
            tabIndex={mode === 'model' ? 0 : -1}
            hidden={mode !== 'model'}
          >
            <ModelExperience model={modelAssets.burger} language={language} active={mode === 'model'} />
          </div>
          <div
            className={styles.stage}
            id="technology-panel-ar"
            role="tabpanel"
            aria-labelledby="technology-tab-ar"
            tabIndex={mode === 'ar' ? 0 : -1}
            hidden={mode !== 'ar'}
          >
            <ModelExperience model={modelAssets.burger} language={language} active={false} />
            <button className={styles.arAction} type="button" onClick={onAROpen}>
              <ScanLine size={18} aria-hidden="true" />
              <span>{text.viewOnTable}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

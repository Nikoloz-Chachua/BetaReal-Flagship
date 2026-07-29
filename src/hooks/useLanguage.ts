import { useCallback, useEffect, useMemo, useState } from 'react'
import { copy, languages } from '../data/i18n'
import type { Language } from '../data/types'

const isLanguage = (value: string | null): value is Language => value === 'en' || value === 'ka'

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>(() => {
    const params = new URLSearchParams(window.location.search)
    const value = params.get('lang')
    return isLanguage(value) ? value : 'en'
  })

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next)
    const url = new URL(window.location.href)
    url.searchParams.set('lang', next)
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
  }, [])

  useEffect(() => {
    document.documentElement.lang = languages[language].htmlLang
    document.title = language === 'ka' ? 'BetaReal — ინტერაქტიული 3D და AR რესტორნის მენიუები.' : 'BetaReal — Interactive 3D and AR Restaurant Menus.'
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (description) {
      description.content =
        language === 'ka'
          ? 'BetaReal ქმნის ინდივიდუალურ რესტორნის ვებსაიტებს და ციფრულ მენიუებს, სადაც სტუმარი კერძს 3D-ში ათვალიერებს და AR-ით საკუთარ მაგიდაზე ათავსებს.'
          : 'BetaReal creates custom restaurant websites and digital menus where guests can inspect dishes in 3D and place them on their table in AR.'
    }
  }, [language])

  return useMemo(() => ({ language, setLanguage, t: copy[language] }), [language, setLanguage])
}

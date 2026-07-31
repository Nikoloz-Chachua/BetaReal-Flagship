import { useEffect } from 'react'
import { isSegmentRoute } from './data/segments'
import { stripBasePath, withBasePath } from './lib/basePath'
import { FlagshipPage } from './pages/FlagshipPage'

export default function App() {
  const pathname = stripBasePath(window.location.pathname)
  const match = pathname.match(/^\/demo\/([^/]+)\/?$/)
  const initialSegment = isSegmentRoute(match?.[1]) ? match[1] : undefined

  if (pathname !== '/' && !initialSegment) {
    return <NotFound />
  }

  return <FlagshipPage initialSegment={initialSegment} />
}

function NotFound() {
  const requestedLanguage = new URLSearchParams(window.location.search).get('lang')
  const language = requestedLanguage === 'en' ? 'en' : 'ka'
  const text =
    language === 'ka'
      ? {
          eyebrow: '404',
          title: 'გვერდი ვერ მოიძებნა',
          body: 'BetaReal-ის ეს გვერდი არ არსებობს.',
          home: 'BetaReal-ის მთავარ გვერდზე გადასვლა',
        }
      : {
          eyebrow: '404',
          title: 'Page not found',
          body: 'This BetaReal page does not exist.',
          home: 'Open BetaReal home',
        }

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  return (
    <main style={{ display: 'grid', minHeight: '100svh', placeItems: 'center', padding: 24 }}>
      <section aria-labelledby="not-found-title" style={{ maxWidth: 520 }}>
        <p style={{ color: 'var(--accent)', fontWeight: 860, margin: '0 0 10px' }}>{text.eyebrow}</p>
        <h1 id="not-found-title" style={{ margin: 0, fontSize: 'clamp(2rem, 8vw, 4rem)', lineHeight: 1 }}>
          {text.title}
        </h1>
        <p style={{ color: 'var(--secondary)' }}>{text.body}</p>
        <a href={withBasePath('/')} style={{ color: 'var(--ink)', fontWeight: 820 }}>
          {text.home}
        </a>
      </section>
    </main>
  )
}

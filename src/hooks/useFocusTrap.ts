import { useEffect } from 'react'

const focusableSelector =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useFocusTrap(active: boolean, container: React.RefObject<HTMLElement>, onEscape: () => void) {
  useEffect(() => {
    if (!active) return
    const root = container.current
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null

    const focusables = () => Array.from(root?.querySelectorAll<HTMLElement>(focusableSelector) ?? [])
    window.setTimeout(() => focusables()[0]?.focus(), 0)

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onEscape()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus()
    }
  }, [active, container, onEscape])
}

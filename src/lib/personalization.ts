export function sanitizeRestaurantParam(value: string | null): string | null {
  if (!value) return null
  const normalized = value.normalize('NFKC').trim()
  if (!normalized) return null
  if (Array.from(normalized).some((char) => {
    const code = char.codePointAt(0) ?? 0
    return code <= 31 || code === 127
  })) {
    return null
  }
  if (/[<>]/u.test(normalized)) return null
  return Array.from(normalized).slice(0, 60).join('')
}

export function sanitizeTrackingParam(value: string | null | undefined): string | undefined {
  if (!value) return undefined

  const normalized = value.normalize('NFKC').trim()
  if (!normalized) return undefined
  if (Array.from(normalized).some((char) => {
    const code = char.codePointAt(0) ?? 0
    return code <= 31 || code === 127
  })) {
    return undefined
  }
  if (/[<>"'`]|:\/\/|www\.|@/iu.test(normalized)) return undefined
  if (!/^[A-Za-z0-9._ -]+$/u.test(normalized)) return undefined

  const digits = normalized.replace(/\D/gu, '')
  const hasLetters = /[A-Za-z]/u.test(normalized)
  if (!hasLetters && digits.length >= 6) return undefined

  const compact = normalized.replace(/ +/gu, '-').slice(0, 64)
  return compact || undefined
}

const configuredBase = import.meta.env.BASE_URL || '/'

export function normalizeBasePath(baseUrl = configuredBase) {
  const trimmed = baseUrl.trim().replace(/^\/+|\/+$/g, '')
  return trimmed ? `/${trimmed}` : ''
}

export function stripBasePath(pathname: string, basePath = normalizeBasePath()) {
  if (!basePath) return pathname || '/'
  if (pathname === basePath || pathname === `${basePath}/`) return '/'
  if (pathname.startsWith(`${basePath}/`)) return pathname.slice(basePath.length) || '/'
  return pathname || '/'
}

export function withBasePath(pathname: string, basePath = normalizeBasePath()) {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${basePath}${normalizedPath}` || '/'
}
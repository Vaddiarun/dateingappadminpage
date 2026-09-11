/**
 * Safely read a dotted path off an unknown API payload, falling back when the
 * field is missing/renamed. The exact response shapes for /admin/* aren't in
 * the Postman collection (it only documents requests), so every page reads
 * through this instead of assuming a fixed field name.
 */
export function pick<T = unknown>(obj: unknown, path: string, fallback: T): T {
  if (obj == null) return fallback
  let cur: unknown = obj
  for (const part of path.split('.')) {
    if (cur == null || typeof cur !== 'object') return fallback
    cur = (cur as Record<string, unknown>)[part]
  }
  return cur === undefined || cur === null ? fallback : (cur as T)
}

/** First matching key among several possible aliases (id vs _id, etc). */
export function pickAny<T = unknown>(obj: unknown, paths: string[], fallback: T): T {
  for (const path of paths) {
    const v = pick<T | undefined>(obj, path, undefined)
    if (v !== undefined) return v
  }
  return fallback
}

/** Pull a single record out of a response that wraps it under a named key (e.g. { user: {...} }). */
export function unwrapObject<T = Record<string, unknown>>(body: unknown, ...keys: string[]): T {
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    for (const key of keys) {
      const v = (body as Record<string, unknown>)[key]
      if (v && typeof v === 'object' && !Array.isArray(v)) return v as T
    }
  }
  return (body ?? {}) as T
}

/** Pull an array out of a list response regardless of its envelope key. */
export function unwrapList<T = unknown>(body: unknown, ...keys: string[]): T[] {
  if (Array.isArray(body)) return body as T[]
  if (body && typeof body === 'object') {
    for (const key of [...keys, 'items', 'data', 'results']) {
      const v = (body as Record<string, unknown>)[key]
      if (Array.isArray(v)) return v as T[]
    }
  }
  return []
}

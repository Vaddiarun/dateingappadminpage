/** Indian-grouped integer, e.g. 1842300 -> "18,42,300". */
export function formatNumber(n: number | undefined | null): string {
  if (n === undefined || n === null || Number.isNaN(n)) return '—'
  return n.toLocaleString('en-IN')
}

/** Paise -> rupees, Indian-grouped, no decimals unless the amount has them. */
export function formatPaise(paise: number | undefined | null): string {
  if (paise === undefined || paise === null || Number.isNaN(paise)) return '—'
  const rupees = paise / 100
  const hasFraction = Math.round(rupees * 100) % 100 !== 0
  return rupees.toLocaleString('en-IN', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  })
}

/** Basis points -> percent string, e.g. 2000 -> "20". */
export function formatBasisPoints(bp: number | undefined | null): string {
  if (bp === undefined || bp === null || Number.isNaN(bp)) return '—'
  return (bp / 100).toString()
}

export function formatDate(iso: string | undefined | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(iso: string | undefined | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  return `${date} · ${time}`
}

/** Seconds -> "1h 05m" / "4m 12s" / "38s". */
export function formatDuration(secs: number | undefined | null): string {
  if (secs === undefined || secs === null || Number.isNaN(secs)) return '—'
  const s = Math.max(0, Math.round(secs))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m) return `${m}m ${String(s % 60).padStart(2, '0')}s`
  return `${s}s`
}

/** "just now" / "12m ago" / "3h ago" / date. */
export function timeAgo(iso: string | undefined | null): string {
  if (!iso) return '—'
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return String(iso)
  const min = Math.round((Date.now() - t) / 60_000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  if (min < 24 * 60) return `${Math.round(min / 60)}h ago`
  return formatDate(iso)
}

/** Local YYYY-MM-DD, `offsetDays` from today. */
export function isoDate(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** snake_case / UPPER_CASE -> "Sentence case". */
export function humanize(v: string | undefined | null): string {
  if (!v) return '—'
  const s = v.replace(/[_-]+/g, ' ').toLowerCase()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

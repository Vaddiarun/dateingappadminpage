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

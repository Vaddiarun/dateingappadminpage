import { useState } from 'react'
import type { ReactNode } from 'react'
import { Card, Label, Button } from './ui'
import { useAsync } from '../lib/useAsync'
import type { Loaded } from '../lib/ops'

/**
 * Loads an ops endpoint (lib/ops.ts). `preview` is true while the backend doesn't have the
 * endpoint yet and sample data is showing. Pages must disable their actions while it is.
 */
export function useLoaded<T>(fn: () => Promise<Loaded<T>>, deps: unknown[]) {
  const s = useAsync(fn, deps)
  return { data: s.data?.data ?? null, preview: s.data?.preview ?? false, loading: s.loading, error: s.error, reload: s.reload }
}

/** Shown above any section rendering sample data, so no one mistakes it for real numbers. */
export function PreviewBanner({ what = 'this section' }: { what?: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-[var(--radius-control)] border border-dashed border-amber/50 bg-amber/5 px-3.5 py-2.5 text-[11px] text-ink">
      <span className="mt-px rounded-sm bg-amber/15 px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.12em] text-amber uppercase">
        Preview
      </span>
      <span className="leading-5 text-muted">
        Sample data. The backend endpoint for {what} isn't live yet, so actions are disabled. Real data
        appears here automatically once it ships.
      </span>
    </div>
  )
}

/* ---------- Stat tiles ---------- */

export function StatTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  tone?: 'amber' | 'ok' | 'warn' | 'danger'
}) {
  const color = { amber: 'text-amber', ok: 'text-ok', warn: 'text-warn', danger: 'text-danger' }
  return (
    <Card className="px-5 py-4">
      <Label>{label}</Label>
      <div className={`mt-2 text-[22px] leading-tight font-medium ${tone ? color[tone] : 'text-ink'}`}>{value}</div>
      {sub && <div className="mt-1 text-[10px] text-muted">{sub}</div>}
    </Card>
  )
}

/* ---------- Pill ---------- */

export type PillTone = 'ok' | 'warn' | 'danger' | 'neutral' | 'primary'

export function Pill({ label, tone = 'neutral' }: { label: ReactNode; tone?: PillTone }) {
  const cls: Record<PillTone, string> = {
    ok: 'bg-ok/10 text-ok',
    warn: 'bg-warn/10 text-warn',
    danger: 'bg-danger/10 text-danger',
    neutral: 'bg-fill text-muted',
    primary: 'bg-primary-soft text-primary',
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] leading-4 font-medium whitespace-nowrap ${cls[tone]}`}>
      {label}
    </span>
  )
}

/** Pulsing dot for "live now" rows. */
export function LiveDot() {
  return (
    <span className="relative inline-flex size-2">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-danger/60" />
      <span className="relative inline-flex size-2 rounded-full bg-danger" />
    </span>
  )
}

/* ---------- Filter select ---------- */

export function Select({
  value,
  onChange,
  options,
  label,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  label?: string
  disabled?: boolean
}) {
  return (
    <label className="inline-flex h-9 w-fit items-center gap-1.5 rounded-full border border-line bg-surface pr-2 pl-3 text-[11px] text-muted">
      {label && <span>{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="cursor-pointer bg-transparent disabled:cursor-not-allowed disabled:opacity-60 text-[11px] text-ink outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

/* ---------- Pager ---------- */

export function Pager({
  page,
  hasMore,
  total,
  onPage,
}: {
  page: number
  hasMore: boolean
  total?: number
  onPage: (p: number) => void
}) {
  return (
    <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
      <span>{total !== undefined ? `${total} total` : ''}</span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <span>Page {page}</span>
        <Button size="sm" variant="outline" disabled={!hasMore} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  )
}

/* ---------- Bar chart (single series, hover tooltip) ---------- */

export function BarChart({
  data,
  format,
  height = 160,
}: {
  data: { label: string; value: number }[]
  format: (v: number) => string
  height?: number
}) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...data.map((d) => d.value))
  const every = Math.max(1, Math.ceil(data.length / 8))
  return (
    <div>
      <div className="relative flex items-end gap-[2px] border-b border-line" style={{ height }}>
        {data.map((d, i) => (
          <div
            key={d.label + i}
            className="group relative flex h-full flex-1 items-end"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <div
              className={`w-full rounded-t-[4px] transition-colors ${hover === i ? 'bg-primary' : 'bg-primary/55'}`}
              style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }}
            />
            {hover === i && (
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 rounded-md border border-line bg-surface px-2 py-1 text-[10px] whitespace-nowrap text-ink shadow-sm">
                <div className="text-muted">{d.label}</div>
                <div className="font-medium">{format(d.value)}</div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-[2px] text-[9px] text-faint">
        {data.map((d, i) => (
          <span key={d.label + i} className="flex-1 truncate text-center">
            {i % every === 0 ? d.label : ''}
          </span>
        ))}
      </div>
      {/* Table view for screen readers */}
      <div className="sr-only">
        <table>
          <tbody>
            {data.map((d) => (
              <tr key={d.label}>
                <td>{d.label}</td>
                <td>{format(d.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** Horizontal split bar (e.g. bad / good / excellent) with a labelled legend. */
export function SplitBar({ parts }: { parts: { label: string; value: number; className: string }[] }) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1
  return (
    <div>
      <div className="flex h-2.5 gap-[2px] overflow-hidden rounded-full">
        {parts.map((p) => (
          <div key={p.label} className={p.className} style={{ width: `${(p.value / total) * 100}%` }} />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
        {parts.map((p) => (
          <span key={p.label} className="inline-flex items-center gap-1.5 text-muted">
            <span className={`size-2 rounded-full ${p.className}`} />
            {p.label} <span className="text-ink">{p.value}</span>
            <span className="text-faint">({Math.round((p.value / total) * 100)}%)</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/** Empty row for Table bodies. */
export function EmptyRow({ cols, label = 'Nothing here yet.' }: { cols: number; label?: string }) {
  return (
    <tr>
      <td colSpan={cols} className="px-5 py-8 text-center text-[12px] text-muted">
        {label}
      </td>
    </tr>
  )
}

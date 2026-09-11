import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { SearchIcon, ChevronDownIcon } from './Icon'

/* ---------- Status tone map ---------- */

export type Tone = 'ok' | 'warn' | 'danger' | 'neutral'

const TONE_BY_LABEL: Record<string, Tone> = {
  active: 'ok',
  approved: 'ok',
  online: 'ok',
  live: 'ok',
  actioned: 'ok',
  pending: 'warn',
  suspended: 'warn',
  open: 'warn',
  'in call': 'warn',
  banned: 'danger',
  rejected: 'danger',
  reject: 'danger',
  offline: 'neutral',
}

export function toneFor(label: string): Tone {
  return TONE_BY_LABEL[label.trim().toLowerCase()] ?? 'neutral'
}

const TONE_TEXT: Record<Tone, string> = {
  ok: 'text-ok',
  warn: 'text-warn',
  danger: 'text-danger',
  neutral: 'text-faint',
}

/** Plain coloured text used inside dense tables (matches Figma). */
export function StatusText({ label }: { label: string }) {
  return <span className={TONE_TEXT[toneFor(label)]}>{label}</span>
}

/** Outlined pill badge (dashboard table). */
export function Badge({ label }: { label: string }) {
  const tone = toneFor(label)
  const ring: Record<Tone, string> = {
    ok: 'border-ok/40 text-ok',
    warn: 'border-warn/40 text-warn',
    danger: 'border-danger/40 text-danger',
    neutral: 'border-line text-faint',
  }
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] leading-4 ${ring[tone]}`}
    >
      {label}
    </span>
  )
}

/* ---------- Buttons ---------- */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  const sizes = {
    sm: 'h-7 px-3 text-[11px]',
    md: 'h-9 px-4 text-[12px]',
  }
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover',
    outline: 'border border-line bg-surface text-ink hover:bg-fill',
    danger: 'border border-danger/50 bg-surface text-danger hover:bg-danger/5',
    ghost: 'text-muted hover:text-ink',
  }
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-control)] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    />
  )
}

/* ---------- Card ---------- */

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border border-line bg-surface ${className}`}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children }: { children: ReactNode }) {
  return (
    <div className="border-b border-line px-5 py-3.5 text-[11px] font-semibold tracking-[0.14em] text-ink uppercase">
      {children}
    </div>
  )
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <span className="text-[9px] font-medium tracking-[0.13em] text-muted uppercase">
      {children}
    </span>
  )
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-control)] bg-fill px-3.5 py-2.5 text-[11px] text-muted">
      {children}
    </div>
  )
}

/* ---------- Form controls ---------- */

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </label>
  )
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }

export function Input({ className = '', invalid, ...props }: InputProps) {
  return (
    <input
      className={`h-10 rounded-[var(--radius-control)] bg-fill px-3 text-[12px] text-ink outline-none ring-1 ring-transparent focus:ring-primary/40 ${
        invalid ? 'ring-danger/50' : ''
      } ${className}`}
      {...props}
    />
  )
}

/** Read-only "value box" used across the detail screens. */
export function ReadonlyField({
  label,
  value,
  accent,
}: {
  label: string
  value: ReactNode
  accent?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <div
        className={`flex h-10 items-center rounded-[var(--radius-control)] bg-fill px-3 text-[12px] ${
          accent ? 'text-amber' : 'text-ink'
        }`}
      >
        {value}
      </div>
    </div>
  )
}

export function SearchInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex h-9 w-64 items-center gap-2 rounded-full border border-line bg-surface px-3 text-muted">
      <SearchIcon size={14} />
      <input
        className="w-full bg-transparent text-[12px] text-ink outline-none"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

export function FilterButton({ label }: { label: string }) {
  return (
    <button className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[11px] text-muted hover:text-ink">
      {label}
      <ChevronDownIcon size={13} />
    </button>
  )
}

/* ---------- Table ---------- */

export function Table({
  columns,
  children,
}: {
  columns: string[]
  children: ReactNode
}) {
  return (
    <Card className="overflow-hidden">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="bg-thead">
            {columns.map((c) => (
              <th
                key={c}
                className="px-5 py-2.5 text-left text-[9px] font-medium tracking-[0.13em] text-muted uppercase"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </Card>
  )
}

export function Row({
  children,
  onClick,
}: {
  children: ReactNode
  onClick?: () => void
}) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-line last:border-0 ${
        onClick ? 'cursor-pointer hover:bg-fill/60' : ''
      }`}
    >
      {children}
    </tr>
  )
}

export function Cell({
  children,
  className = '',
}: {
  children?: ReactNode
  className?: string
}) {
  return <td className={`px-5 py-3 text-ink ${className}`}>{children}</td>
}

/* ---------- Key / value list (detail cards) ---------- */

export function KVList({ children }: { children: ReactNode }) {
  return <div className="flex flex-col">{children}</div>
}

export function KVRow({
  label,
  value,
  accent,
}: {
  label: string
  value: ReactNode
  accent?: boolean
}) {
  return (
    <div className="flex items-center justify-between border-b border-line py-2.5 text-[12px] last:border-0">
      <span className="text-muted">{label}</span>
      <span className={accent ? 'text-ok' : 'text-ink'}>{value}</span>
    </div>
  )
}

/* ---------- Tabs ---------- */

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string }[]
  active: string
  onChange: (key: string) => void
}) {
  return (
    <div className="flex gap-2">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`h-8 rounded-[var(--radius-control)] px-3 text-[12px] transition-colors ${
            active === t.key
              ? 'bg-primary text-white'
              : 'text-muted underline underline-offset-2 hover:text-ink'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

/* ---------- Async states ---------- */

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return <div className="p-8 text-center text-[12px] text-muted">{label}</div>
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="flex flex-col items-center gap-3 p-8 text-center">
      <p className="text-[12px] text-danger">{message}</p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      )}
    </Card>
  )
}

/* ---------- Two-column detail layout ---------- */

export function DetailGrid({
  children,
  variant = 'main-aside',
}: {
  children: ReactNode
  /** main-aside: wide left + 300px right (review panels). aside-main: 340px left + wide right (account). */
  variant?: 'main-aside' | 'aside-main'
}) {
  const cols =
    variant === 'aside-main'
      ? 'lg:grid-cols-[340px_minmax(0,1fr)]'
      : 'lg:grid-cols-[minmax(0,1fr)_300px]'
  return <div className={`grid grid-cols-1 gap-4 ${cols}`}>{children}</div>
}

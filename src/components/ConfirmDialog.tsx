import { useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from './ui'

export type ConfirmSpec = {
  title: string
  subtitle?: string
  question?: string
  /** "Previous / New" comparison rows. */
  compare?: { label: string; value: string }[]
  /** Dashed-border contextual note. */
  context?: string
  /** Filled generic note (audit-log line). */
  note?: string
  /** Show a free-text reason input; its value is passed to onConfirm. */
  reason?: boolean
  confirmLabel?: string
}

export function ConfirmDialog({
  open,
  spec,
  onConfirm,
  onCancel,
}: {
  open: boolean
  spec: ConfirmSpec | null
  onConfirm: (reason?: string) => void
  onCancel: () => void
}) {
  const [reason, setReason] = useState('')
  if (!open || !spec) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 p-6">
      <div className="w-[460px] max-w-full rounded-[12px] border border-line bg-surface p-6 shadow-xl">
        <h3 className="text-[13px] font-semibold text-ink">{spec.title}</h3>

        {spec.subtitle && (
          <p className="mt-2 text-[12px] text-ink">{spec.subtitle}</p>
        )}
        {spec.question && (
          <p className="mt-2 text-[12px] leading-5 text-muted">{spec.question}</p>
        )}

        {spec.compare && (
          <div className="mt-3 overflow-hidden rounded-[var(--radius-control)] border border-line">
            {spec.compare.map((c, i) => (
              <div
                key={c.label}
                className={`flex items-center justify-between px-3 py-2 text-[11px] ${
                  i === 0 ? 'bg-fill' : 'bg-fill/60'
                }`}
              >
                <span className="text-muted">{c.label}</span>
                <span className="text-ink">{c.value}</span>
              </div>
            ))}
          </div>
        )}

        {spec.context && (
          <div className="mt-3 rounded-[var(--radius-control)] border border-dashed border-line px-3 py-2.5 text-[11px] font-medium text-ink">
            {spec.context}
          </div>
        )}

        {spec.reason && (
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter the Reason"
            className="mt-3 h-9 w-full rounded-[var(--radius-control)] bg-fill px-3 text-[12px] text-ink outline-none ring-1 ring-transparent focus:ring-primary/40"
          />
        )}

        {spec.note && (
          <div className="mt-3 rounded-[var(--radius-control)] bg-fill px-3 py-2.5 text-[11px] text-muted">
            {spec.note}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2.5">
          <Button size="sm" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => onConfirm(spec.reason ? reason : undefined)}>
            {spec.confirmLabel ?? 'Confirm Action'}
          </Button>
        </div>
      </div>
    </div>
  )
}

/** Small hook to drive a confirm dialog. */
export function useConfirm() {
  const [spec, setSpec] = useState<ConfirmSpec | null>(null)
  const [onDone, setOnDone] = useState<(reason?: string) => void>(() => () => {})
  return {
    spec,
    open: spec !== null,
    ask(next: ConfirmSpec, done: (reason?: string) => void) {
      setSpec(next)
      setOnDone(() => done)
    },
    confirm(reason?: string) {
      onDone(reason)
      setSpec(null)
    },
    cancel() {
      setSpec(null)
    },
  }
}

export function ConfirmHost({
  ctl,
}: {
  ctl: ReturnType<typeof useConfirm>
}): ReactNode {
  return (
    <ConfirmDialog
      open={ctl.open}
      spec={ctl.spec}
      onConfirm={ctl.confirm}
      onCancel={ctl.cancel}
    />
  )
}

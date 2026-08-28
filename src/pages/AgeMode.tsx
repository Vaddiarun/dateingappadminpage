import { useState } from 'react'
import { Page } from '../components/Layout'
import { Card, Button, Note, FilterButton } from '../components/ui'
import { ConfirmDialog } from '../components/ConfirmDialog'

export function AgeMode() {
  const [enabled, setEnabled] = useState(true)
  const [pending, setPending] = useState<boolean | null>(null)

  const next = pending ?? !enabled

  return (
    <Page title="18+ Mode">
      <Card>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <span className="text-[11px] font-semibold tracking-[0.14em] text-ink uppercase">
            18+ Mode
          </span>
          <FilterButton label="Last 30 days" />
        </div>
        <div className="flex flex-col gap-4 p-5">
          <div className="text-[13px] text-muted">Current Status</div>
          <div className="flex items-center gap-5 text-[12px]">
            {[
              { label: 'OFF', value: false },
              { label: 'ON', value: true },
            ].map((o) => (
              <label key={o.label} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="age-mode"
                  className="accent-primary"
                  checked={enabled === o.value}
                  onChange={() => setPending(o.value)}
                />
                <span className={enabled === o.value ? 'font-medium text-ink' : 'text-muted'}>
                  {o.label}
                </span>
              </label>
            ))}
          </div>
          <div>
            <Button size="sm" onClick={() => setPending(!enabled)}>
              Change
            </Button>
          </div>
          <Note>Accessible to Super Admin Only</Note>
        </div>
      </Card>

      <ConfirmDialog
        open={pending !== null}
        spec={{
          title: 'Confirm moderation action',
          compare: [
            { label: 'Previous', value: enabled ? 'ON' : 'OFF' },
            { label: 'New', value: next ? 'ON' : 'OFF' },
          ],
          context: 'Effective from now. This is written to the audit log.',
          confirmLabel: 'Confirm Action',
        }}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          setEnabled(next)
          setPending(null)
        }}
      />
    </Page>
  )
}

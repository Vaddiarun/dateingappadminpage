import { useState } from 'react'
import { Page } from '../components/Layout'
import { Card, Button, Note, FilterButton, LoadingState, ErrorState } from '../components/ui'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { getAdultModeConfig, setAdultModeConfig, ApiError } from '../lib/api'
import { useAsync } from '../lib/useAsync'
import { latestConfig } from '../lib/configHistory'
import { pick, unwrapList } from '../lib/pick'

export function AgeMode() {
  const { data, loading, error, reload } = useAsync(() => getAdultModeConfig(), [])
  const [pending, setPending] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  if (loading) return <Page title="18+ Mode"><LoadingState /></Page>
  if (error) return <Page title="18+ Mode"><ErrorState message={error} onRetry={reload} /></Page>

  const enabled = pick(latestConfig(unwrapList<Record<string, unknown>>(data, 'configs')), 'enabled', false)
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
          {saveError && <p className="text-[11px] text-danger">{saveError}</p>}
          <Note>Accessible to Super Admin Only</Note>
        </div>
      </Card>

      <ConfirmDialog
        open={pending !== null}
        spec={{
          title: 'Confirm 18+ mode change',
          compare: [
            { label: 'Previous', value: enabled ? 'ON' : 'OFF' },
            { label: 'New', value: next ? 'ON' : 'OFF' },
          ],
          context: 'Effective from now. This is written to the audit log.',
          confirmLabel: 'Confirm Action',
        }}
        onCancel={() => setPending(null)}
        onConfirm={async () => {
          setSaving(true)
          setSaveError(null)
          try {
            await setAdultModeConfig(next)
            setPending(null)
            reload()
          } catch (err) {
            setSaveError(err instanceof ApiError ? err.message : 'Something went wrong.')
            setPending(null)
          } finally {
            setSaving(false)
          }
        }}
      />
      {saving && <LoadingState label="Saving…" />}
    </Page>
  )
}

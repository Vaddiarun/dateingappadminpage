import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Page } from '../components/Layout'
import { Card, CardHeader, Field, Input, Button, Note, LoadingState, ErrorState } from '../components/ui'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { PreviewBanner, useLoaded } from '../components/ops'
import { getAppSettings, saveAppSettings, type AppSettings as Settings } from '../lib/ops'
import { ApiError } from '../lib/api'
import { formatDuration, formatPaise } from '../lib/format'
import { pick } from '../lib/pick'

/** Form values in human units (hours, minutes, rupees). */
type Form = { goalHours: string; goodMin: string; excellentMin: string; msgMin: string; msgMax: string; commentMax: string }

function toForm(s: unknown): Form {
  return {
    goalHours: String(pick(s, 'dailyGoalSeconds', 21600) / 3600),
    goodMin: String(pick(s, 'callQuality.goodFromSeconds', 240) / 60),
    excellentMin: String(pick(s, 'callQuality.excellentFromSeconds', 601) / 60),
    msgMin: String(pick(s, 'messagePrice.minPaise', 500) / 100),
    msgMax: String(pick(s, 'messagePrice.maxPaise', 10000) / 100),
    commentMax: String(pick(s, 'liveCommentMaxLength', 2000)),
  }
}

function fromForm(f: Form): Settings | string {
  const n = (v: string) => Number(v)
  const vals = Object.values(f).map(n)
  if (vals.some((v) => !Number.isFinite(v) || v <= 0)) return 'Every value must be a positive number.'
  if (n(f.goalHours) > 24) return 'The daily goal can be at most 24 hours.'
  if (n(f.excellentMin) <= n(f.goodMin)) return '"Excellent from" must be longer than "Good from".'
  if (n(f.msgMax) < n(f.msgMin)) return 'The maximum message price must be at least the minimum.'
  return {
    dailyGoalSeconds: Math.round(n(f.goalHours) * 3600),
    callQuality: { goodFromSeconds: Math.round(n(f.goodMin) * 60), excellentFromSeconds: Math.round(n(f.excellentMin) * 60) },
    messagePrice: { minPaise: Math.round(n(f.msgMin) * 100), maxPaise: Math.round(n(f.msgMax) * 100) },
    liveCommentMaxLength: Math.round(n(f.commentMax)),
  }
}

export function AppSettings() {
  const { data, preview, loading, error, reload } = useLoaded(() => getAppSettings(), [])
  const [form, setForm] = useState<Form | null>(null)
  const [confirm, setConfirm] = useState<Settings | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  useEffect(() => {
    if (data) setForm(toForm(data))
  }, [data])

  if (loading || !form) return <Page title="App Settings" breadcrumb="Pricing & Economics">{error ? <ErrorState message={error} onRetry={reload} /> : <LoadingState />}</Page>

  const set = (k: keyof Form) => (e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })
  const parsed = fromForm(form)

  return (
    <Page title="App Settings" breadcrumb="Pricing & Economics">
      <div className="flex max-w-[860px] flex-col gap-4">
        {preview && <PreviewBanner what="app settings" />}
        <Card>
          <CardHeader>Host daily goal</CardHeader>
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <Field label="Online hours per day">
              <Input type="number" min={1} max={24} step={0.5} value={form.goalHours} onChange={set('goalHours')} />
            </Field>
            <Note>Hosts see progress toward this on their Daily report. Today it’s {formatDuration(pick(data, 'dailyGoalSeconds', 0))}.</Note>
          </div>
        </Card>

        <Card>
          <CardHeader>Call quality bands</CardHeader>
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <Field label="Good from (minutes)">
              <Input type="number" min={1} step={0.5} value={form.goodMin} onChange={set('goodMin')} />
            </Field>
            <Field label="Excellent from (minutes)">
              <Input type="number" min={1} step={0.5} value={form.excellentMin} onChange={set('excellentMin')} />
            </Field>
            <div className="sm:col-span-2">
              <Note>Calls shorter than “Good from” are marked Bad. Hosts see the band on every call in their history.</Note>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>Chat & live limits</CardHeader>
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
            <Field label="Message price min (₹)">
              <Input type="number" min={0} step={1} value={form.msgMin} onChange={set('msgMin')} />
            </Field>
            <Field label="Message price max (₹)">
              <Input type="number" min={0} step={1} value={form.msgMax} onChange={set('msgMax')} />
            </Field>
            <Field label="Live comment max length">
              <Input type="number" min={1} step={1} value={form.commentMax} onChange={set('commentMax')} />
            </Field>
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <Button disabled={preview || typeof parsed === 'string'} onClick={() => typeof parsed !== 'string' && setConfirm(parsed)}>
            Save settings
          </Button>
          <Button variant="outline" onClick={() => { setForm(toForm(data)); setMsg(null) }}>
            Reset
          </Button>
          {typeof parsed === 'string' && <span className="text-[11px] text-danger">{parsed}</span>}
          {msg && <span className={`text-[11px] ${msg.ok ? 'text-ok' : 'text-danger'}`}>{msg.text}</span>}
        </div>
      </div>

      <ConfirmDialog
        open={confirm !== null}
        spec={
          confirm
            ? {
                title: 'Save app settings',
                compare: [
                  { label: 'Daily goal', value: formatDuration(confirm.dailyGoalSeconds) },
                  { label: 'Good / excellent from', value: `${formatDuration(confirm.callQuality.goodFromSeconds)} / ${formatDuration(confirm.callQuality.excellentFromSeconds)}` },
                  { label: 'Message price', value: `₹ ${formatPaise(confirm.messagePrice.minPaise)} – ₹ ${formatPaise(confirm.messagePrice.maxPaise)}` },
                  { label: 'Live comment max', value: `${confirm.liveCommentMaxLength} chars` },
                ],
                context: 'Applies to all hosts and users immediately.',
                note: 'This change will be recorded in the audit log.',
                confirmLabel: 'Save',
              }
            : null
        }
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          const s = confirm
          setConfirm(null)
          if (!s) return
          try {
            await saveAppSettings(s)
            setMsg({ ok: true, text: 'Saved.' })
            reload()
          } catch (err) {
            setMsg({ ok: false, text: err instanceof ApiError ? err.message : 'Something went wrong.' })
          }
        }}
      />
    </Page>
  )
}

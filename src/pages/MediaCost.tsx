import { useState } from 'react'
import { Page } from '../components/Layout'
import {
  Card,
  CardHeader,
  Button,
  Field,
  Input,
  Note,
  Label,
  Table,
  Row,
  Cell,
  LoadingState,
  ErrorState,
} from '../components/ui'
import { ConfirmDialog, type ConfirmSpec } from '../components/ConfirmDialog'
import {
  ApiError,
  getCallMediaConfig,
  setCallMediaConfig,
  getLiveMediaConfig,
  setLiveMediaConfig,
  getCallMediaQuality,
  type CallMediaMode,
  type LiveMediaProvider,
  type MediaQualityRow,
} from '../lib/api'
import { useAsync } from '../lib/useAsync'

// Every switch here starts at the plain-Agora setting (how the platform always worked) and
// can be put back to it at any time. Changes apply to calls/broadcasts started afterwards.

const CALL_MODES: { value: CallMediaMode; label: string; hint: string }[] = [
  { value: 'agora', label: 'Agora', hint: 'Every call on Agora, billed per participant-minute.' },
  { value: 'p2p', label: 'Direct (p2p)', hint: 'Every call device-to-device; calls that can\'t connect directly fail.' },
  { value: 'auto', label: 'Auto', hint: 'Direct first, switching to Agora mid-call if it can\'t connect. Same 720p quality either way.' },
]

const LIVE_PROVIDERS: { value: LiveMediaProvider; label: string; hint: string }[] = [
  { value: 'agora', label: 'Agora', hint: 'Billed per minute for the host and every viewer.' },
  { value: 'cloudflare', label: 'Cloudflare', hint: 'Billed per GB sent; same 720p video, under a second of delay.' },
]

function Choice<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Button key={o.value} size="sm" variant={o.value === value ? 'primary' : 'outline'} onClick={() => onChange(o.value)}>
          {o.label}
        </Button>
      ))}
    </div>
  )
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-start gap-2 text-[12px] text-ink">
      <input type="checkbox" className="mt-0.5" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

const onOff = (b: boolean) => (b ? 'on' : 'off')

export function MediaCost() {
  const { data, loading, error, reload } = useAsync(
    () => Promise.all([getCallMediaConfig(), getLiveMediaConfig(), getCallMediaQuality(7)]),
    [],
  )
  const [callDraft, setCallDraft] = useState<{ provider: CallMediaMode; autoP2pPercent: string; agoraKickOnEnd: boolean } | null>(null)
  const [liveDraft, setLiveDraft] = useState<{ provider: LiveMediaProvider; agoraKickOnEnd: boolean; pauseHiddenVideo: boolean } | null>(null)
  const [confirm, setConfirm] = useState<{ spec: ConfirmSpec; save: () => Promise<unknown>; clearDraft: () => void } | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  if (loading) return <Page title="Media & Video Cost" breadcrumb="Pricing & Economics"><LoadingState /></Page>
  if (error) return <Page title="Media & Video Cost" breadcrumb="Pricing & Economics"><ErrorState message={error} onRetry={reload} /></Page>

  const [callConfig, liveConfig, quality] = data!
  const call = callDraft ?? { provider: callConfig.current, autoP2pPercent: String(callConfig.autoP2pPercent), agoraKickOnEnd: callConfig.agoraKickOnEnd }
  const live = liveDraft ?? { provider: liveConfig.provider, agoraKickOnEnd: liveConfig.agoraKickOnEnd, pauseHiddenVideo: liveConfig.pauseHiddenVideo }
  const percent = Number(call.autoP2pPercent)
  const percentValid = Number.isInteger(percent) && percent >= 0 && percent <= 100

  const describeCalls = (c: { provider: CallMediaMode; autoP2pPercent: number; agoraKickOnEnd: boolean }) =>
    `${CALL_MODES.find((m) => m.value === c.provider)?.label}${c.provider === 'auto' ? ` (${c.autoP2pPercent}% direct)` : ''} · close channel ${onOff(c.agoraKickOnEnd)}`
  const describeLive = (l: { provider: LiveMediaProvider; agoraKickOnEnd: boolean; pauseHiddenVideo: boolean }) =>
    `${LIVE_PROVIDERS.find((p) => p.value === l.provider)?.label} · close channel ${onOff(l.agoraKickOnEnd)} · pause hidden video ${onOff(l.pauseHiddenVideo)}`

  const saveCalls = () => {
    const next = { provider: call.provider, autoP2pPercent: percent, agoraKickOnEnd: call.agoraKickOnEnd }
    setConfirm({
      spec: {
        title: 'Confirm call media update',
        compare: [
          { label: 'Previous', value: describeCalls({ provider: callConfig.current, autoP2pPercent: callConfig.autoP2pPercent, agoraKickOnEnd: callConfig.agoraKickOnEnd }) },
          { label: 'New', value: describeCalls(next) },
        ],
        context: 'Applies to calls placed from now on. Calls already ringing or in progress keep their current network. Billing is unaffected.',
        confirmLabel: 'Confirm Action',
      },
      save: () => setCallMediaConfig(next),
      clearDraft: () => setCallDraft(null),
    })
  }

  const saveLive = () => {
    setConfirm({
      spec: {
        title: 'Confirm live media update',
        compare: [
          { label: 'Previous', value: describeLive(liveConfig) },
          { label: 'New', value: describeLive(live) },
        ],
        context: 'The network applies to broadcasts started from now on; running broadcasts keep theirs.',
        confirmLabel: 'Confirm Action',
      },
      save: () => setLiveMediaConfig(live),
      clearDraft: () => setLiveDraft(null),
    })
  }

  const qualityValue = (v: number | null, suffix = '') => (v === null || v === undefined ? '—' : `${v}${suffix}`)

  return (
    <Page title="Media & Video Cost" breadcrumb="Pricing & Economics">
      <div className="flex flex-col gap-5">
        <Card>
          <CardHeader>1:1 calls</CardHeader>
          <div className="flex max-w-[640px] flex-col gap-4 p-5">
            <div className="flex flex-col gap-1.5">
              <Label>Network</Label>
              <Choice options={CALL_MODES} value={call.provider} onChange={(provider) => setCallDraft({ ...call, provider })} />
              <span className="text-[11px] text-muted">{CALL_MODES.find((m) => m.value === call.provider)?.hint}</span>
            </div>
            {call.provider === 'auto' && (
              <Field label="Share of new calls that try direct first (%)">
                <Input
                  value={call.autoP2pPercent}
                  onChange={(e) => setCallDraft({ ...call, autoP2pPercent: e.target.value })}
                  inputMode="numeric"
                  invalid={!percentValid}
                  className="w-28"
                />
              </Field>
            )}
            <Checkbox
              checked={call.agoraKickOnEnd}
              onChange={(agoraKickOnEnd) => setCallDraft({ ...call, agoraKickOnEnd })}
              label="Close the Agora channel when a call ends, so no one can keep using it after billing stops"
            />
            <div>
              <Button size="sm" onClick={saveCalls} disabled={!percentValid}>Save</Button>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>Live broadcasts</CardHeader>
          <div className="flex max-w-[640px] flex-col gap-4 p-5">
            <div className="flex flex-col gap-1.5">
              <Label>Network</Label>
              <Choice options={LIVE_PROVIDERS} value={live.provider} onChange={(provider) => setLiveDraft({ ...live, provider })} />
              <span className="text-[11px] text-muted">{LIVE_PROVIDERS.find((p) => p.value === live.provider)?.hint}</span>
            </div>
            <Checkbox
              checked={live.agoraKickOnEnd}
              onChange={(agoraKickOnEnd) => setLiveDraft({ ...live, agoraKickOnEnd })}
              label="Close the Agora channel when a broadcast ends"
            />
            <Checkbox
              checked={live.pauseHiddenVideo}
              onChange={(pauseHiddenVideo) => setLiveDraft({ ...live, pauseHiddenVideo })}
              label="Pause video for viewers who switch away from the app (audio keeps playing; video resumes when they come back)"
            />
            <div>
              <Button size="sm" onClick={saveLive}>Save</Button>
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-2">
          <div className="text-[11px] font-semibold tracking-[0.14em] text-ink uppercase">Call quality — last {quality.days} days</div>
          <Table columns={['Network', 'Calls reported', 'Connected', 'Via relay', 'Connect time', 'Round trip', 'Packet loss', 'Video']}>
            {quality.byProvider.length === 0 && (
              <Row><Cell className="text-muted">No reports yet</Cell></Row>
            )}
            {quality.byProvider.map((r: MediaQualityRow) => (
              <Row key={r.mediaProvider}>
                <Cell>{r.mediaProvider === 'p2p' ? 'Direct (p2p)' : 'Agora'}</Cell>
                <Cell>{r.reports}</Cell>
                <Cell>{qualityValue(r.connectedPercent, '%')}</Cell>
                <Cell>{qualityValue(r.relayedPercent, '%')}</Cell>
                <Cell>{qualityValue(r.avgConnectMs, ' ms')}</Cell>
                <Cell>{qualityValue(r.avgRttMs, ' ms')}</Cell>
                <Cell>{qualityValue(r.avgPacketLossPercent, '%')}</Cell>
                <Cell>{qualityValue(r.avgVideoKbps, ' kbps')}</Cell>
              </Row>
            ))}
          </Table>
          <Note>
            Auto calls: {quality.autoCalls} started direct, {quality.fellBackToAgora} switched to Agora. Compare the two networks here before
            raising the direct share.
          </Note>
        </div>
        {saveError && <p className="text-[11px] text-danger">{saveError}</p>}
      </div>

      <ConfirmDialog
        open={confirm !== null}
        spec={confirm?.spec ?? null}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          const pending = confirm
          setConfirm(null)
          if (!pending) return
          setSaving(true)
          setSaveError(null)
          try {
            await pending.save()
            pending.clearDraft()
            reload()
          } catch (err) {
            setSaveError(err instanceof ApiError ? err.message : 'Something went wrong.')
          } finally {
            setSaving(false)
          }
        }}
      />
      {saving && <LoadingState label="Saving…" />}
    </Page>
  )
}

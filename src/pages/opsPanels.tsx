/**
 * Ops sections embedded in existing pages: user wallet + refunds, per-account call history,
 * host performance, reported-chat review and dashboard insights.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, Button, Field, Input, Note, Table, Row, Cell, LoadingState, ErrorState } from '../components/ui'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { PreviewBanner, StatTile, BarChart, SplitBar, Select, Pager, Pill, EmptyRow, useLoaded } from '../components/ops'
import {
  getUserWallet,
  adjustUserWallet,
  listCalls,
  getHostDailySummary,
  getHostStatsSummary,
  getReportConversation,
  getDashboardInsights,
} from '../lib/ops'
import { ApiError } from '../lib/api'
import { formatDuration, formatNumber, formatPaise, formatDateTime, humanize, isoDate } from '../lib/format'
import { pick, unwrapList } from '../lib/pick'
import { CallsTable } from './Calls'

const shortDay = (d: string) => {
  const t = new Date(`${d}T00:00:00`)
  return Number.isNaN(t.getTime()) ? d : t.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

/* ---------- User wallet & refunds ---------- */

const TX_TONE: Record<string, 'ok' | 'primary' | 'neutral' | 'warn'> = { recharge: 'ok', refund: 'primary', adjustment: 'warn' }

export function UserWalletPanel({ userId }: { userId: string }) {
  const { data, preview, loading, error, reload } = useLoaded(() => getUserWallet(userId), [userId])
  const [amount, setAmount] = useState('')
  const [direction, setDirection] = useState<'credit' | 'debit'>('credit')
  const [reason, setReason] = useState('')
  const [reference, setReference] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const tx = unwrapList<Record<string, unknown>>(data, 'transactions')
  const rupees = Number(amount)
  const valid = Number.isFinite(rupees) && rupees > 0 && reason.trim().length >= 5
  const signedPaise = Math.round(rupees * 100) * (direction === 'credit' ? 1 : -1)

  return (
    <div className="flex flex-col gap-4">
      {preview && <PreviewBanner what="user wallets" />}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-4">
          <StatTile label="Wallet balance" value={`₹ ${formatPaise(pick(data, 'balancePaise', 0))}`} tone="amber" />
          <Table columns={['When', 'Type', 'Reference', 'Amount']}>
            {tx.map((t) => {
              const amt = pick(t, 'amountPaise', 0)
              const type = pick<string>(t, 'type', '')
              return (
                <Row key={pick<string>(t, 'id', '')}>
                  <Cell className="text-muted">{formatDateTime(pick(t, 'createdAt', null))}</Cell>
                  <Cell><Pill label={humanize(type)} tone={TX_TONE[type] ?? 'neutral'} /></Cell>
                  <Cell className="text-muted">{pick<string>(t, 'reference', '—')}</Cell>
                  <Cell className={amt >= 0 ? 'text-ok' : 'text-ink'}>{amt >= 0 ? '+' : '−'} ₹ {formatPaise(Math.abs(amt))}</Cell>
                </Row>
              )
            })}
            {tx.length === 0 && <EmptyRow cols={4} label="No wallet activity yet." />}
          </Table>
        </div>

        <Card className="h-fit">
          <CardHeader>Refund / adjust</CardHeader>
          <div className="flex flex-col gap-3 p-5">
            <Select
              label="Type"
              value={direction}
              onChange={(v) => setDirection(v as 'credit' | 'debit')}
              options={[{ value: 'credit', label: 'Credit (refund)' }, { value: 'debit', label: 'Debit (correction)' }]}
            />
            <Field label="Amount (₹)">
              <Input type="number" min={1} step={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 120" />
            </Field>
            <Field label="Reason">
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Call dropped after 20s" />
            </Field>
            <Field label="Reference (optional)">
              <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Call id or ticket id" />
            </Field>
            <Button disabled={preview || !valid} onClick={() => setConfirm(true)}>
              Review adjustment
            </Button>
            {!valid && (amount || reason) && <p className="text-[10px] text-muted">Enter an amount and a reason of at least 5 characters.</p>}
            {msg && <p className={`text-[11px] ${msg.ok ? 'text-ok' : 'text-danger'}`}>{msg.text}</p>}
            <Note>Adjustments are written to the wallet ledger and the audit log. They can’t be deleted — correct a mistake with an opposite adjustment.</Note>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={confirm}
        spec={{
          title: direction === 'credit' ? 'Credit user wallet' : 'Debit user wallet',
          subtitle: `User: ${userId}`,
          compare: [
            { label: 'Current balance', value: `₹ ${formatPaise(pick(data, 'balancePaise', 0))}` },
            { label: 'After adjustment', value: `₹ ${formatPaise(pick(data, 'balancePaise', 0) + signedPaise)}` },
          ],
          context: `${direction === 'credit' ? '+' : '−'} ₹ ${formatPaise(Math.abs(signedPaise))} · ${reason}`,
          note: 'This action will be recorded in the audit log.',
          confirmLabel: direction === 'credit' ? 'Credit wallet' : 'Debit wallet',
        }}
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          setConfirm(false)
          setMsg(null)
          try {
            await adjustUserWallet(userId, signedPaise, reason.trim(), reference.trim() || undefined)
            setAmount('')
            setReason('')
            setReference('')
            setMsg({ ok: true, text: 'Wallet updated.' })
            reload()
          } catch (err) {
            setMsg({ ok: false, text: err instanceof ApiError ? err.message : 'Something went wrong.' })
          }
        }}
      />
    </div>
  )
}

/* ---------- Calls for one user / host ---------- */

export function AccountCallsPanel({ userId, hostId }: { userId?: string; hostId?: string }) {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('all')
  const { data, preview, loading, error, reload } = useLoaded(() => listCalls({ userId, hostId, filter, page, pageSize: 15 }), [userId, hostId, filter, page])
  const rows = unwrapList<Record<string, unknown>>(data, 'calls')
  return (
    <div className="flex flex-col gap-3">
      {preview && <PreviewBanner what="call history" />}
      <div>
        <Select
          label="Show"
          value={filter}
          onChange={(v) => { setFilter(v); setPage(1) }}
          options={[{ value: 'all', label: 'All calls' }, { value: 'video', label: 'Video' }, { value: 'voice', label: 'Voice' }, { value: 'missed', label: 'Missed' }]}
        />
      </div>
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <>
          <CallsTable rows={rows} hide={userId ? ['user'] : ['host']} onOpen={(id) => navigate(`/calls/${encodeURIComponent(id)}`)} />
          <Pager page={page} hasMore={pick(data, 'hasMore', false)} total={pick(data, 'total', undefined)} onPage={setPage} />
        </>
      )}
    </div>
  )
}

/* ---------- Host performance ---------- */

const RANGES = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
]

export function HostPerformancePanel({ hostId }: { hostId: string }) {
  const [range, setRange] = useState('7')
  const from = isoDate(-(Number(range) - 1))
  const to = isoDate(0)
  const daily = useLoaded(() => getHostDailySummary(hostId, from, to), [hostId, from, to])
  const summary = useLoaded(() => getHostStatsSummary(hostId, from, to), [hostId, from, to])

  if (daily.loading || summary.loading) return <LoadingState />
  if (daily.error || summary.error) return <ErrorState message={daily.error || summary.error || ''} onRetry={() => { daily.reload(); summary.reload() }} />

  const days = unwrapList<Record<string, unknown>>(daily.data, 'days')
  const s = summary.data
  const received = pick(s, 'calls.received', 0)
  const answered = pick(s, 'calls.answered', 0)
  const earnParts = [
    ['Calls', pick(s, 'earnings.callsPaise', 0)],
    ['Gifts', pick(s, 'earnings.giftsPaise', 0)],
    ['Live', pick(s, 'earnings.livePaise', 0)],
    ['Other', pick(s, 'earnings.otherPaise', 0)],
  ] as const

  return (
    <div className="flex flex-col gap-4">
      {(daily.preview || summary.preview) && <PreviewBanner what="host performance" />}
      <div>
        <Select label="Period" value={range} onChange={setRange} options={RANGES} />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Earned" value={`₹ ${formatPaise(pick(s, 'earnings.totalPaise', 0))}`} tone="amber" />
        <StatTile label="Online time" value={formatDuration(pick(s, 'onlineSeconds', 0))} />
        <StatTile label="Answer rate" value={received ? `${Math.round((answered / received) * 100)}%` : '—'} sub={`${answered} of ${received} calls`} />
        <StatTile label="Avg call" value={formatDuration(pick(s, 'calls.avgCallSeconds', 0))} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>Earnings per day</CardHeader>
          <div className="p-5">
            <BarChart data={days.map((d) => ({ label: shortDay(pick<string>(d, 'date', '')), value: pick(d, 'earningsPaise', 0) }))} format={(v) => `₹ ${formatPaise(v)}`} />
          </div>
        </Card>
        <Card>
          <CardHeader>Online hours per day</CardHeader>
          <div className="p-5">
            <BarChart data={days.map((d) => ({ label: shortDay(pick<string>(d, 'date', '')), value: pick(d, 'onlineSeconds', 0) }))} format={(v) => formatDuration(v)} />
          </div>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>Where earnings came from</CardHeader>
          <div className="flex flex-col p-5">
            {earnParts.map(([label, v]) => (
              <div key={label} className="flex items-center justify-between border-b border-line py-2 text-[12px] last:border-0">
                <span className="text-muted">{label}</span>
                <span className="text-amber">₹ {formatPaise(v)}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader>Calls</CardHeader>
          <div className="flex flex-col gap-4 p-5">
            <SplitBar
              parts={[
                { label: 'Answered', value: answered, className: 'bg-ok' },
                { label: 'Missed', value: pick(s, 'calls.missed', 0), className: 'bg-warn' },
                { label: 'Rejected', value: pick(s, 'calls.rejected', 0), className: 'bg-danger' },
              ]}
            />
            <div>
              <div className="mb-2 text-[9px] font-medium tracking-[0.13em] text-muted uppercase">Call quality</div>
              <SplitBar
                parts={[
                  { label: 'Bad', value: pick(s, 'quality.bad', 0), className: 'bg-danger/70' },
                  { label: 'Good', value: pick(s, 'quality.good', 0), className: 'bg-primary/60' },
                  { label: 'Excellent', value: pick(s, 'quality.excellent', 0), className: 'bg-ok' },
                ]}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

/* ---------- Moderation: reported chat ---------- */

export function ReportConversationCard({ reportId, reportedId }: { reportId: string; reportedId?: string }) {
  const { data, preview, loading, error, reload } = useLoaded(() => getReportConversation(reportId), [reportId])
  const messages = unwrapList<Record<string, unknown>>(data, 'messages')
  return (
    <Card>
      <CardHeader>Chat between them</CardHeader>
      <div className="flex flex-col gap-3 p-5">
        {preview && <PreviewBanner what="reported conversations" />}
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : messages.length === 0 ? (
          <p className="text-[12px] text-muted">No chat messages between these accounts.</p>
        ) : (
          <div className="flex max-h-[360px] flex-col gap-2.5 overflow-y-auto">
            {messages.map((m, i) => {
              const flagged = reportedId && pick<string>(m, 'senderId', '') === reportedId
              return (
                <div key={pick(m, 'id', String(i))} className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-faint">
                    {pick<string>(m, 'senderName', '—')} · {humanize(pick<string>(m, 'senderRole', ''))} · {formatDateTime(pick(m, 'createdAt', null))}
                  </span>
                  <div className={`w-fit max-w-[90%] rounded-[10px] px-3 py-2 text-[12px] ${flagged ? 'bg-danger/10 text-ink ring-1 ring-danger/30' : 'bg-fill text-ink'}`}>
                    {/* Photos come with a short-lived signed URL; gifts with the gift that was sent. */}
                    {pick<string>(m, 'type', 'text') === 'image' && pick<string>(m, 'mediaUrl', '') && (
                      <a href={pick<string>(m, 'mediaUrl', '')} target="_blank" rel="noreferrer" className="mb-1 block">
                        <img src={pick<string>(m, 'mediaUrl', '')} alt="Photo sent in chat" className="max-h-48 rounded-[8px] object-cover" />
                      </a>
                    )}
                    {pick<string>(m, 'type', 'text') === 'gift' && <span className="text-muted">Sent a gift: {pick<string>(m, 'gift.name', 'gift')}</span>}
                    {pick<string>(m, 'content', '')}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <p className="text-[10px] text-muted">Messages from the reported account are highlighted. Viewing is written to the audit log.</p>
      </div>
    </Card>
  )
}

/* ---------- Dashboard insights ---------- */

export function DashboardInsights() {
  const from = isoDate(-13)
  const to = isoDate(0)
  const { data, preview, loading, error, reload } = useLoaded(() => getDashboardInsights(from, to), [from, to])
  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const series = unwrapList<Record<string, unknown>>(data, 'revenueSeries')
  const top = unwrapList<Record<string, unknown>>(data, 'topByOnlineTime')
  const missedRate = pick(data, 'missedRate', 0)

  return (
    <div className="flex flex-col gap-4">
      {preview && <PreviewBanner what="dashboard insights" />}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Hosts online now" value={formatNumber(pick(data, 'hostsOnlineNow', 0))} tone="ok" />
        <StatTile label="Avg call length" value={formatDuration(pick(data, 'avgCallSeconds', 0))} sub="Last 14 days" />
        <StatTile label="Missed call rate" value={`${(missedRate * 100).toFixed(1)}%`} tone={missedRate > 0.2 ? 'danger' : missedRate > 0.1 ? 'warn' : 'ok'} sub="Calls not answered by hosts" />
        <StatTile
          label="Video vs voice"
          value={`${formatNumber(pick(data, 'callsByType.video', 0))} / ${formatNumber(pick(data, 'callsByType.voice', 0))}`}
          sub="Calls, last 14 days"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>Revenue per day</CardHeader>
          <div className="p-5">
            <BarChart data={series.map((d) => ({ label: shortDay(pick<string>(d, 'date', '')), value: pick(d, 'revenuePaise', 0) }))} format={(v) => `₹ ${formatPaise(v)}`} />
          </div>
        </Card>
        <Card>
          <CardHeader>Call minutes per day</CardHeader>
          <div className="p-5">
            <BarChart data={series.map((d) => ({ label: shortDay(pick<string>(d, 'date', '')), value: pick(d, 'callMinutes', 0) }))} format={(v) => `${formatNumber(v)} min`} />
          </div>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>Call outcomes</CardHeader>
          <div className="p-5">
            <SplitBar
              parts={[
                { label: 'Completed', value: pick(data, 'callsByStatus.completed', 0), className: 'bg-ok' },
                { label: 'Missed', value: pick(data, 'callsByStatus.missed', 0), className: 'bg-warn' },
                { label: 'Rejected', value: pick(data, 'callsByStatus.rejected', 0), className: 'bg-danger' },
              ]}
            />
          </div>
        </Card>
        <Card>
          <CardHeader>Most online hosts</CardHeader>
          <div className="flex flex-col p-3">
            {top.map((h, i) => (
              <div key={pick(h, 'hostId', String(i))} className="flex items-center justify-between px-2 py-2 text-[12px]">
                <span><span className="mr-2 text-faint">{i + 1}</span>{pick(h, 'hostName', pick<string>(h, 'hostId', '—'))}</span>
                <span className="text-muted">{formatDuration(pick(h, 'onlineSeconds', 0))}</span>
              </div>
            ))}
            {top.length === 0 && <p className="px-2 py-3 text-[11px] text-muted">No data.</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}

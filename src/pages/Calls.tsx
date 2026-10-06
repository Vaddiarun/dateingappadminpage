import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Page } from '../components/Layout'
import { Table, Row, Cell, Card, CardHeader, Tabs, Button, KVList, KVRow, DetailGrid, LoadingState, ErrorState, SearchInput } from '../components/ui'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { PreviewBanner, Pill, Select, Pager, EmptyRow, LiveDot, useLoaded, type PillTone } from '../components/ops'
import { listLiveCalls, listCalls, getCall, endCall } from '../lib/ops'
import { ApiError } from '../lib/api'
import { formatDateTime, formatDuration, formatPaise, humanize, timeAgo } from '../lib/format'
import { pick, pickAny, unwrapList, unwrapObject } from '../lib/pick'

export const callStatusTone = (s: string): PillTone =>
  s === 'completed' ? 'ok' : s === 'missed' || s === 'failed' ? 'danger' : s === 'rejected' ? 'warn' : s === 'ongoing' || s === 'ringing' ? 'primary' : 'neutral'
export const qualityTone = (q: string): PillTone => (q === 'excellent' ? 'ok' : q === 'good' ? 'primary' : q === 'bad' ? 'danger' : 'neutral')

/** Ticks every second so live durations count up. */
function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(t)
  }, [ms])
  return now
}

export function Calls() {
  const [tab, setTab] = useState('live')
  return (
    <Page title="Calls">
      <div className="flex flex-col gap-4">
        <Tabs tabs={[{ key: 'live', label: 'Live now' }, { key: 'history', label: 'History' }]} active={tab} onChange={setTab} />
        {tab === 'live' ? <LiveCalls /> : <CallHistory />}
      </div>
    </Page>
  )
}

function LiveCalls() {
  const navigate = useNavigate()
  const now = useNow()
  const { data, preview, loading, error, reload } = useLoaded(() => listLiveCalls(), [])
  // Refresh the live list every 15s.
  useEffect(() => {
    const t = setInterval(reload, 15_000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const rows = unwrapList<Record<string, unknown>>(data, 'calls')

  if (loading && !data) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={reload} />
  return (
    <>
      {preview && <PreviewBanner what="live calls" />}
      <Table columns={['', 'Call', 'Type', 'User', 'Host', 'Status', 'Duration', 'Rate / min']}>
        {rows.map((c) => {
          const id = pick<string>(c, 'id', '—')
          const started = new Date(pick<string>(c, 'startedAt', '')).getTime()
          const status = pick<string>(c, 'status', 'ongoing')
          return (
            <Row key={id} onClick={() => navigate(`/calls/${encodeURIComponent(id)}`)}>
              <Cell className="w-6"><LiveDot /></Cell>
              <Cell className="text-muted">{id}</Cell>
              <Cell>{humanize(pick<string>(c, 'type', ''))}</Cell>
              <Cell>{pickAny(c, ['userName', 'callerName'], '—')}</Cell>
              <Cell>{pick<string>(c, 'hostName', '—')}</Cell>
              <Cell><Pill label={humanize(status)} tone={callStatusTone(status)} /></Cell>
              <Cell className="tabular-nums">{Number.isNaN(started) ? '—' : formatDuration((now - started) / 1000)}</Cell>
              <Cell className="text-amber">₹ {formatPaise(pickAny(c, ['ratePerMinutePaiseSnapshot', 'ratePerMinutePaise'], null))}</Cell>
            </Row>
          )
        })}
        {rows.length === 0 && <EmptyRow cols={8} label="No calls in progress right now." />}
      </Table>
      <p className="text-[10px] text-muted">Refreshes every 15 seconds.</p>
    </>
  )
}

function CallHistory() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const { data, preview, loading, error, reload } = useLoaded(() => listCalls({ filter, q: q || undefined, page, pageSize: 20 }), [filter, q, page])
  const rows = unwrapList<Record<string, unknown>>(data, 'calls')

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Search call id, user or host" value={q} onChange={(v) => { setQ(v); setPage(1) }} />
        <Select
          label="Show"
          value={filter}
          onChange={(v) => { setFilter(v); setPage(1) }}
          options={[{ value: 'all', label: 'All calls' }, { value: 'video', label: 'Video' }, { value: 'voice', label: 'Voice' }, { value: 'missed', label: 'Missed' }]}
        />
      </div>
      {preview && <PreviewBanner what="call history" />}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <>
          <CallsTable rows={rows} onOpen={(id) => navigate(`/calls/${encodeURIComponent(id)}`)} />
          <Pager page={page} hasMore={pick(data, 'hasMore', false)} total={pick(data, 'total', undefined)} onPage={setPage} />
        </>
      )}
    </>
  )
}

/** Shared by the Calls page and the user / host detail tabs. */
export function CallsTable({ rows, onOpen, hide = [] }: { rows: Record<string, unknown>[]; onOpen: (id: string) => void; hide?: ('user' | 'host')[] }) {
  const cols = ['Call', 'When', 'Type', ...(hide.includes('user') ? [] : ['User']), ...(hide.includes('host') ? [] : ['Host']), 'Status', 'Duration', 'Charged', 'Quality']
  return (
    <Table columns={cols}>
      {rows.map((c) => {
        const id = pick<string>(c, 'id', '—')
        const status = pick<string>(c, 'status', '')
        const quality = pick<string>(c, 'durationQuality', '')
        return (
          <Row key={id} onClick={() => onOpen(id)}>
            <Cell className="text-muted">{id}</Cell>
            <Cell className="text-muted">{timeAgo(pickAny(c, ['startedAt', 'createdAt'], null))}</Cell>
            <Cell>{humanize(pick<string>(c, 'type', ''))}</Cell>
            {!hide.includes('user') && <Cell>{pickAny(c, ['userName', 'callerName'], '—')}</Cell>}
            {!hide.includes('host') && <Cell>{pick<string>(c, 'hostName', '—')}</Cell>}
            <Cell><Pill label={humanize(status)} tone={callStatusTone(status)} /></Cell>
            <Cell className="tabular-nums">{formatDuration(pick(c, 'durationSeconds', 0))}</Cell>
            <Cell className="text-amber">₹ {formatPaise(pick(c, 'totalAmountPaise', 0))}</Cell>
            <Cell>{quality ? <Pill label={humanize(quality)} tone={qualityTone(quality)} /> : <span className="text-faint">—</span>}</Cell>
          </Row>
        )
      })}
      {rows.length === 0 && <EmptyRow cols={cols.length} label="No calls found." />}
    </Table>
  )
}

export function CallDetail() {
  const params = useParams()
  const id = params.id ? decodeURIComponent(params.id) : ''
  const now = useNow()
  const { data, preview, loading, error, reload } = useLoaded(() => getCall(id), [id])
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  if (loading) return <Page title={id} breadcrumb="Calls"><LoadingState /></Page>
  if (error) return <Page title={id} breadcrumb="Calls"><ErrorState message={error} onRetry={reload} /></Page>

  const c = unwrapObject(data, 'call')
  const status = pick<string>(c, 'status', '')
  const isLive = status === 'ongoing' || status === 'ringing'
  const started = new Date(pick<string>(c, 'startedAt', '')).getTime()
  const quality = pick<string>(c, 'durationQuality', '')
  const userId = pick<string>(c, 'userId', '')
  const hostId = pick<string>(c, 'hostId', '')

  return (
    <Page title={`Call · ${id}`} breadcrumb="Calls">
      <div className="flex flex-col gap-4">
        {preview && <PreviewBanner what="calls" />}
        <DetailGrid>
          <Card>
            <CardHeader>Call</CardHeader>
            <div className="p-5">
              <KVList>
                <KVRow label="Status" value={<Pill label={humanize(status)} tone={callStatusTone(status)} />} />
                <KVRow label="Type" value={humanize(pick<string>(c, 'type', ''))} />
                <KVRow label="Started" value={formatDateTime(pick(c, 'startedAt', null))} />
                {!isLive && <KVRow label="Ended" value={formatDateTime(pick(c, 'endedAt', null))} />}
                <KVRow
                  label="Duration"
                  value={isLive && !Number.isNaN(started) ? formatDuration((now - started) / 1000) : formatDuration(pick(c, 'durationSeconds', 0))}
                />
                {!isLive && <KVRow label="End reason" value={humanize(pick<string>(c, 'endReason', ''))} />}
                <KVRow label="Rate / min" value={`₹ ${formatPaise(pickAny(c, ['ratePerMinutePaiseSnapshot', 'ratePerMinutePaise'], null))}`} />
                {!isLive && <KVRow label="User charged" value={<span className="text-amber">₹ {formatPaise(pick(c, 'totalAmountPaise', 0))}</span>} />}
                {!isLive && <KVRow label="Host earned" value={<span className="text-ok">₹ {formatPaise(pick(c, 'earnedPaise', 0))}</span>} />}
                {quality && <KVRow label="Quality" value={<Pill label={humanize(quality)} tone={qualityTone(quality)} />} />}
              </KVList>
            </div>
          </Card>

          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>People</CardHeader>
              <div className="flex flex-col gap-3 p-5 text-[12px]">
                <div>
                  <div className="text-[10px] text-muted uppercase">User</div>
                  {userId ? <Link className="text-primary underline underline-offset-2" to={`/users/${encodeURIComponent(userId)}`}>{pickAny(c, ['userName', 'callerName'], userId)}</Link> : '—'}
                </div>
                <div>
                  <div className="text-[10px] text-muted uppercase">Host</div>
                  {hostId ? <Link className="text-primary underline underline-offset-2" to={`/hosts/${encodeURIComponent(hostId)}`}>{pick(c, 'hostName', hostId)}</Link> : '—'}
                </div>
              </div>
            </Card>
            {isLive && (
              <Card>
                <CardHeader>Intervene</CardHeader>
                <div className="flex flex-col gap-2 p-5">
                  <p className="text-[11px] leading-5 text-muted">Ends the call for both sides immediately. The user is billed only up to now.</p>
                  <Button variant="danger" size="sm" disabled={preview || busy} onClick={() => setConfirm(true)}>
                    End call now
                  </Button>
                  {actionError && <p className="text-[11px] text-danger">{actionError}</p>}
                </div>
              </Card>
            )}
          </div>
        </DetailGrid>
      </div>

      <ConfirmDialog
        open={confirm}
        spec={{
          title: 'End this call?',
          subtitle: `Call ${id}`,
          context: 'Both people are disconnected immediately.',
          note: 'This action will be recorded in the audit log.',
          reason: true,
          confirmLabel: 'End call',
        }}
        onCancel={() => setConfirm(false)}
        onConfirm={async (reason) => {
          setConfirm(false)
          setBusy(true)
          setActionError(null)
          try {
            await endCall(id, reason || 'Ended by admin')
            reload()
          } catch (err) {
            setActionError(err instanceof ApiError ? err.message : 'Something went wrong.')
          } finally {
            setBusy(false)
          }
        }}
      />
    </Page>
  )
}

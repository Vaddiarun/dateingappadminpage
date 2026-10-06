import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Page } from '../components/Layout'
import { Table, Row, Cell, Card, CardHeader, Tabs, Button, KVList, KVRow, DetailGrid, LoadingState, ErrorState, SearchInput } from '../components/ui'
import { PreviewBanner, Pill, Select, EmptyRow, useLoaded, type PillTone } from '../components/ops'
import { listTickets, getTicket, replyToTicket, updateTicket } from '../lib/ops'
import { ApiError } from '../lib/api'
import { formatDateTime, humanize, timeAgo } from '../lib/format'
import { pick, pickAny, unwrapList, unwrapObject } from '../lib/pick'

/*
 * Backend shapes (host + user tickets in one list):
 *   GET /admin/support/tickets?status=open|in_progress|waiting_on_customer|resolved|closed&needsAgent=true|false
 *     → { tickets: [{ ticket: { id, subject, category, status, needsAgent, accountId, lastMessageAt, createdAt },
 *                     account: { id, name, phone, role: 'host' | 'user' } }] }
 *   GET /admin/support/tickets/:id → { ticket, messages: [{ id, sender: 'host'|'user'|'bot'|'agent', senderName, content, createdAt }] }
 *   PATCH /admin/support/tickets/:id { status?: open|in_progress|waiting_on_customer|resolved|closed, priority?: low|medium|high|urgent }
 */

const STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'waiting_on_customer', label: 'Waiting on customer' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]
const STATUS_TABS = [...STATUSES.map((s) => ({ key: s.value, label: s.label })), { key: 'all', label: 'All' }]
const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

export const ticketStatusTone = (s: string): PillTone =>
  s === 'open' ? 'warn' : s === 'in_progress' ? 'primary' : s === 'resolved' || s === 'closed' ? 'ok' : 'neutral'

/** Re-fetches every `ms` while the page is open and visible, without the loading spinner, so new
 * messages and tickets show up by themselves. Returns the latest data (or null until the first poll).
 * Skipped in preview (sample data) mode. */
function useLiveRefresh<T>(fn: () => Promise<{ data: T; preview: boolean }>, ms: number, deps: unknown[], enabled: boolean) {
  const [latest, setLatest] = useState<T | null>(null)
  const fnRef = useRef(fn)
  fnRef.current = fn
  useEffect(() => {
    setLatest(null)
    if (!enabled) return
    let stopped = false
    const tick = () => {
      if (document.visibilityState !== 'visible') return
      fnRef.current().then((r) => { if (!stopped && !r.preview) setLatest(r.data) }).catch(() => {})
    }
    const t = setInterval(tick, ms)
    return () => { stopped = true; clearInterval(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, ms])
  return latest
}

type Account = { id: string; name: string; phone: string; role: string }

/** The account a ticket belongs to — `account` on the row/response, with older field names as fallbacks. */
function accountOf(row: unknown, ticket: unknown): Account {
  const a = pickAny<Record<string, unknown> | null>(row, ['account', 'ticket.account', 'host', 'requester'], null)
  return {
    id: pickAny<string>(a, ['id'], '') || pickAny<string>(ticket, ['accountId', 'hostId', 'userId'], ''),
    name: pickAny<string>(a, ['name'], '') || pickAny<string>(a, ['phone'], ''),
    phone: pickAny<string>(a, ['phone'], ''),
    role: pickAny<string>(a, ['role'], '') || pickAny<string>(ticket, ['accountRole', 'role'], ''),
  }
}

export function Support() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('open')
  const [role, setRole] = useState('all')
  const [needsAgent, setNeedsAgent] = useState('all')
  const [q, setQ] = useState('')
  const { data, preview, loading, error, reload } = useLoaded(
    () => listTickets({ status: status === 'all' ? undefined : status, needsAgent: needsAgent === 'all' ? undefined : needsAgent }),
    [status, needsAgent],
  )
  const liveList = useLiveRefresh(
    () => listTickets({ status: status === 'all' ? undefined : status, needsAgent: needsAgent === 'all' ? undefined : needsAgent }),
    15_000, [status, needsAgent], !preview && !loading,
  )
  const rows = unwrapList<Record<string, unknown>>(liveList ?? data, 'tickets')
    .map((row) => {
      const ticket = unwrapObject(row, 'ticket')
      return { ticket, account: accountOf(row, ticket) }
    })
    .filter(({ ticket, account }) => {
      if (role !== 'all' && account.role !== role) return false
      const s = q.toLowerCase()
      return !s || [pick<string>(ticket, 'id', ''), pick<string>(ticket, 'subject', ''), account.name, account.phone].some((v) => String(v).toLowerCase().includes(s))
    })

  return (
    <Page
      title="Support"
      actions={
        <>
          <Link to="/support/bot" className="text-[12px] text-primary underline underline-offset-2">Bot & articles</Link>
          <SearchInput placeholder="Search tickets" value={q} onChange={setQ} />
          <Select value={role} onChange={setRole} label="From" options={[{ value: 'all', label: 'Everyone' }, { value: 'user', label: 'Users' }, { value: 'host', label: 'Hosts' }]} />
          <Select value={needsAgent} onChange={setNeedsAgent} label="Needs agent" options={[{ value: 'all', label: 'Any' }, { value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]} />
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {preview && <PreviewBanner what="support tickets" />}
        <Tabs tabs={STATUS_TABS} active={status} onChange={setStatus} />
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <Table columns={['Ticket', 'Subject', 'From', 'Category', 'Status', 'Last activity']}>
            {rows.map(({ ticket, account }) => {
              const id = pick<string>(ticket, 'id', '—')
              const st = pick<string>(ticket, 'status', '')
              return (
                <Row key={id} onClick={() => navigate(`/support/${encodeURIComponent(id)}`)}>
                  <Cell className="max-w-[120px] truncate text-muted">{id}</Cell>
                  <Cell className="max-w-[320px] truncate">{pick<string>(ticket, 'subject', '—')}</Cell>
                  <Cell>
                    {account.name || '—'} {account.role && <span className="text-[10px] text-faint">· {account.role}</span>}
                  </Cell>
                  <Cell className="text-muted">{humanize(pick<string>(ticket, 'category', ''))}</Cell>
                  <Cell>
                    <div className="flex flex-wrap gap-1">
                      <Pill label={humanize(st)} tone={ticketStatusTone(st)} />
                      {pick<boolean>(ticket, 'needsAgent', false) && <Pill label="Needs agent" tone="danger" />}
                    </div>
                  </Cell>
                  <Cell className="text-muted">{timeAgo(pickAny(ticket, ['lastMessageAt', 'updatedAt', 'createdAt'], null))}</Cell>
                </Row>
              )
            })}
            {rows.length === 0 && <EmptyRow cols={6} label="No tickets in this view." />}
          </Table>
        )}
      </div>
    </Page>
  )
}

const SENDER_STYLE: Record<string, string> = {
  agent: 'ml-auto bg-primary text-white',
  bot: 'bg-primary-soft text-ink',
  user: 'bg-fill text-ink',
  host: 'bg-fill text-ink',
}

export function SupportTicket() {
  const params = useParams()
  const id = params.id ? decodeURIComponent(params.id) : ''
  const { data: loaded, preview, loading, error, reload } = useLoaded(() => getTicket(id), [id])
  // New messages from the user/host (and other agents) appear without leaving the ticket.
  const liveData = useLiveRefresh(() => getTicket(id), 4_000, [id, loaded], !preview && !loading)
  const data = liveData ?? loaded
  const endRef = useRef<HTMLDivElement>(null)
  const msgCount = unwrapList(data, 'messages').length
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [msgCount])
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  if (loading) return <Page title={id} breadcrumb="Support"><LoadingState /></Page>
  if (error) return <Page title={id} breadcrumb="Support"><ErrorState message={error} onRetry={reload} /></Page>

  const ticket = unwrapObject(data, 'ticket')
  const messages = unwrapList<Record<string, unknown>>(data, 'messages')
  const account = accountOf(data, ticket)
  // The detail response has no account object, so fall back to the sender name on the account's own messages.
  const ownMsg = messages.find((m) => ['host', 'user'].includes(pick<string>(m, 'sender', '')))
  const accountName = account.name || pick<string>(ownMsg, 'senderName', '')
  const role = account.role || pick<string>(ownMsg, 'sender', '')
  const status = pick<string>(ticket, 'status', 'open')

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    setActionError(null)
    try {
      await fn()
      reload()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Page title={pick(ticket, 'subject', id)} breadcrumb={`Support · ${id}`}>
      <div className="flex flex-col gap-4">
        {preview && <PreviewBanner what="support tickets" />}
        <DetailGrid>
          <Card className="flex min-h-[520px] flex-col">
            <CardHeader>Conversation</CardHeader>
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
              {messages.map((m, i) => {
                const sender = pick<string>(m, 'sender', 'user')
                return (
                  <div key={pick(m, 'id', String(i))} className={`flex max-w-[78%] flex-col gap-1 ${sender === 'agent' ? 'ml-auto items-end' : ''}`}>
                    <span className="text-[10px] text-faint">
                      {pick(m, 'senderName', humanize(sender))} · {humanize(sender)} · {formatDateTime(pick(m, 'createdAt', null))}
                    </span>
                    <div className={`rounded-[12px] px-3.5 py-2.5 text-[12px] leading-5 whitespace-pre-wrap ${SENDER_STYLE[sender] ?? SENDER_STYLE.user}`}>
                      {pick<string>(m, 'content', '')}
                    </div>
                  </div>
                )
              })}
              {messages.length === 0 && <p className="text-[12px] text-muted">No messages yet.</p>}
              <div ref={endRef} />
            </div>
            <div className="flex gap-2 border-t border-line p-3">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={2}
                placeholder={preview ? 'Replies are disabled in preview' : `Reply to ${accountName || 'the requester'}…`}
                disabled={preview || busy}
                className="flex-1 resize-none rounded-[var(--radius-control)] bg-fill px-3 py-2 text-[12px] text-ink outline-none ring-1 ring-transparent focus:ring-primary/40 disabled:opacity-60"
              />
              <Button
                disabled={preview || busy || !reply.trim()}
                onClick={() => run(async () => { await replyToTicket(id, reply.trim()); setReply('') })}
                className="self-end"
              >
                Send
              </Button>
            </div>
          </Card>

          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>Ticket</CardHeader>
              <div className="flex flex-col gap-3 p-5">
                <div className="flex flex-wrap gap-1.5">
                  <Pill label={humanize(status)} tone={ticketStatusTone(status)} />
                  {pick<boolean>(ticket, 'needsAgent', false) && <Pill label="Needs agent" tone="danger" />}
                </div>
                <Select
                  label="Status"
                  value={status}
                  onChange={(v) => run(() => updateTicket(id, { status: v }))}
                  options={STATUSES}
                  disabled={preview || busy}
                />
                <Select
                  label="Priority"
                  value={pick<string>(ticket, 'priority', 'medium')}
                  onChange={(v) => run(() => updateTicket(id, { priority: v }))}
                  options={PRIORITIES}
                  disabled={preview || busy}
                />
                {preview && <p className="text-[10px] text-muted">Changes are disabled in preview.</p>}
                <KVList>
                  <KVRow label="Category" value={humanize(pick<string>(ticket, 'category', ''))} />
                  <KVRow label="Opened" value={formatDateTime(pick(ticket, 'createdAt', null))} />
                  <KVRow label="Last activity" value={timeAgo(pickAny(ticket, ['lastMessageAt', 'updatedAt'], null))} />
                </KVList>
                {actionError && <p className="text-[11px] text-danger">{actionError}</p>}
              </div>
            </Card>

            {(pick<string>(ticket, 'summary', '') || pick<string>(ticket, 'handoffReason', '')) && (
              <Card>
                <CardHeader>From the assistant</CardHeader>
                <div className="flex flex-col gap-2 p-5 text-[12px] leading-5">
                  {pick<string>(ticket, 'handoffReason', '') && (
                    <div><span className="text-muted">Why it needs a person: </span>{pick<string>(ticket, 'handoffReason', '')}</div>
                  )}
                  {pick<string>(ticket, 'summary', '') && <p className="whitespace-pre-wrap text-ink">{pick<string>(ticket, 'summary', '')}</p>}
                  <p className="text-[10px] text-faint">Written automatically — check it against the conversation.</p>
                </div>
              </Card>
            )}

            <Card>
              <CardHeader>Requester</CardHeader>
              <div className="flex flex-col gap-2 p-5 text-[12px]">
                <div className="font-medium text-ink">{accountName || '—'}</div>
                <div className="text-[11px] text-muted">{[humanize(role), account.phone].filter((v) => v && v !== '—').join(' · ') || '—'}</div>
                {account.id && (role === 'host' || role === 'user') && (
                  <Link className="text-[11px] text-primary underline underline-offset-2" to={`/${role === 'host' ? 'hosts' : 'users'}/${encodeURIComponent(account.id)}`}>
                    Open {role} profile
                  </Link>
                )}
              </div>
            </Card>
          </div>
        </DetailGrid>
      </div>
    </Page>
  )
}

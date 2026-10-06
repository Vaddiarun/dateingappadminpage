import { useState } from 'react'
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
 *   GET /admin/support/tickets?status=open|closed&needsAgent=true|false
 *     → { tickets: [{ ticket: { id, subject, category, status, needsAgent, accountId, lastMessageAt, createdAt },
 *                     account: { id, name, phone, role: 'host' | 'user' } }] }
 *   GET /admin/support/tickets/:id → { ticket, messages: [{ id, sender: 'host'|'user'|'bot'|'agent', senderName, content, createdAt }] }
 *   PATCH /admin/support/tickets/:id { status: 'open' | 'closed' }
 */

const STATUS_TABS = [
  { key: 'open', label: 'Open' },
  { key: 'closed', label: 'Closed' },
  { key: 'all', label: 'All' },
]

export const ticketStatusTone = (s: string): PillTone => (s === 'open' ? 'warn' : s === 'closed' ? 'ok' : 'neutral')

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
  const rows = unwrapList<Record<string, unknown>>(data, 'tickets')
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
  const { data, preview, loading, error, reload } = useLoaded(() => getTicket(id), [id])
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
                <Button
                  size="sm"
                  variant={status === 'open' ? 'outline' : 'primary'}
                  disabled={preview || busy}
                  onClick={() => run(() => updateTicket(id, { status: status === 'open' ? 'closed' : 'open' }))}
                >
                  {status === 'open' ? 'Close ticket' : 'Reopen ticket'}
                </Button>
                {preview && <p className="text-[10px] text-muted">Changes are disabled in preview.</p>}
                <KVList>
                  <KVRow label="Category" value={humanize(pick<string>(ticket, 'category', ''))} />
                  <KVRow label="Opened" value={formatDateTime(pick(ticket, 'createdAt', null))} />
                  <KVRow label="Last activity" value={timeAgo(pickAny(ticket, ['lastMessageAt', 'updatedAt'], null))} />
                </KVList>
                {actionError && <p className="text-[11px] text-danger">{actionError}</p>}
              </div>
            </Card>

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

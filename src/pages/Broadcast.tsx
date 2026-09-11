import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Page } from '../components/Layout'
import {
  Table,
  Row,
  Cell,
  Card,
  CardHeader,
  SearchInput,
  Button,
  Field,
  Input,
  Label,
  LoadingState,
  ErrorState,
} from '../components/ui'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ResultCard } from '../components/ResultCard'
import { listBroadcastMessages, sendBroadcastMessage, ApiError } from '../lib/api'
import { useAsync } from '../lib/useAsync'
import { formatDate } from '../lib/format'
import { pick, pickAny, unwrapList } from '../lib/pick'

const RECIPIENT_OPTIONS = [
  { value: 'all', label: 'All Users & Hosts' },
  { value: 'all_users', label: 'All Users' },
  { value: 'all_hosts', label: 'All Hosts' },
] as const

export function Broadcast() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const { data, loading, error, reload } = useAsync(() => listBroadcastMessages(), [])
  const rows = unwrapList<Record<string, unknown>>(data, 'messages', 'broadcasts')
    .map((b) => ({
      message: pickAny(b, ['title', 'message'], '—'),
      recipients: pick(b, 'recipients', '—'),
      sentBy: pickAny(b, ['sentByName', 'sentByAdminId', 'sentBy', 'adminEmail'], '—'),
      sent: formatDate(pickAny(b, ['sentAt', 'createdAt'], null)),
    }))
    .filter((b) => b.message.toLowerCase().includes(q.toLowerCase()))

  return (
    <Page
      title="Broadcast Messaging"
      actions={
        <>
          <SearchInput placeholder="Search Users" value={q} onChange={setQ} />
          <Button size="sm" variant="outline" onClick={() => navigate('/broadcast/new')}>
            + New Message
          </Button>
        </>
      }
    >
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <Table columns={['Message', 'Recipients', 'Sent By', 'Sent']}>
          {rows.map((b, i) => (
            <Row key={i}>
              <Cell>{b.message}</Cell>
              <Cell className="text-muted">{b.recipients}</Cell>
              <Cell className="text-muted">{b.sentBy}</Cell>
              <Cell className="text-muted">{b.sent}</Cell>
            </Row>
          ))}
        </Table>
      )}
    </Page>
  )
}

export function BroadcastNew() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [recipients, setRecipients] = useState<(typeof RECIPIENT_OPTIONS)[number]['value']>('all')
  const [message, setMessage] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  return (
    <Page title="Broadcast Messaging">
      <Card>
        <CardHeader>Request</CardHeader>
        <div className="p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Title">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Scheduled maintenance tonight"
              />
            </Field>
            <div className="flex flex-col gap-1.5">
              <Label>Recipients</Label>
              <select
                value={recipients}
                onChange={(e) => setRecipients(e.target.value as typeof recipients)}
                className="h-10 rounded-[var(--radius-control)] bg-fill px-3 text-[12px] text-ink outline-none ring-1 ring-transparent focus:ring-primary/40"
              >
                {RECIPIENT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-1 flex-col gap-1.5 sm:max-w-[50%]">
              <Label>Message</Label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Enter Your Text"
                className="rounded-[var(--radius-control)] bg-fill p-3 text-[12px] text-ink outline-none ring-1 ring-transparent focus:ring-primary/40"
              />
            </div>
            <div className="flex gap-2.5">
              <Button size="sm" variant="outline" onClick={() => navigate('/broadcast')}>
                Discard
              </Button>
              <Button
                size="sm"
                disabled={!message.trim() || !title.trim()}
                onClick={() => setConfirm(true)}
              >
                Send
              </Button>
            </div>
          </div>
          {sendError && <p className="mt-2 text-[11px] text-danger">{sendError}</p>}
        </div>
      </Card>

      <ConfirmDialog
        open={confirm}
        spec={{
          title: 'Send broadcast message',
          question: 'Send this message to all users & hosts?',
          note: 'This action will be recorded in the audit log.',
          confirmLabel: 'Confirm & Send',
        }}
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          setConfirm(false)
          setSending(true)
          setSendError(null)
          try {
            await sendBroadcastMessage(title, message, recipients)
            navigate('/broadcast/sent')
          } catch (err) {
            setSendError(err instanceof ApiError ? err.message : 'Something went wrong.')
          } finally {
            setSending(false)
          }
        }}
      />
      {sending && <LoadingState label="Sending…" />}
    </Page>
  )
}

export function BroadcastSent() {
  return (
    <Page title="Dashboard">
      <ResultCard
        title="Message sent"
        body="The broadcast message was delivered. This action was written to the audit log."
        actions={[
          { label: 'Back to Dashboard', to: '/' },
          { label: 'Back to Message Queue', to: '/broadcast' },
        ]}
      />
    </Page>
  )
}

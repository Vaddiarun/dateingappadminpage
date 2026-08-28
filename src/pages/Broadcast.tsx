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
} from '../components/ui'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ResultCard } from '../components/ResultCard'
import { broadcasts } from '../data'

export function Broadcast() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const rows = broadcasts.filter((b) =>
    b.message.toLowerCase().includes(q.toLowerCase()),
  )

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
    </Page>
  )
}

export function BroadcastNew() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [recipients, setRecipients] = useState('All users')
  const [message, setMessage] = useState('')
  const [confirm, setConfirm] = useState(false)

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
            <Field label="Recipients">
              <Input
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
              />
            </Field>
            <div className="flex flex-col gap-1.5">
              <Label>Sent By</Label>
              <div className="flex h-10 items-center rounded-[var(--radius-control)] bg-fill px-3 text-[12px] text-ink">
                Admin A
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Sent</Label>
              <div className="flex h-10 items-center rounded-[var(--radius-control)] bg-fill px-3 text-[12px] text-ink">
                12 Aug 2026 · 18:20
              </div>
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
                disabled={!message.trim()}
                onClick={() => setConfirm(true)}
              >
                Send
              </Button>
            </div>
          </div>
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
        onConfirm={() => navigate('/broadcast/sent')}
      />
    </Page>
  )
}

export function BroadcastSent() {
  return (
    <Page title="Dashboard">
      <ResultCard
        title="Message sent"
        body="The broadcast message was delivered to all users & hosts. This action was written to the audit log."
        actions={[
          { label: 'Back to Dashboard', to: '/' },
          { label: 'Back to Message Queue', to: '/broadcast' },
        ]}
      />
    </Page>
  )
}

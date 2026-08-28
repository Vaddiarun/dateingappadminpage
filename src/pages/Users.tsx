import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Page } from '../components/Layout'
import {
  Table,
  Row,
  Cell,
  Card,
  CardHeader,
  StatusText,
  SearchInput,
  FilterButton,
  Button,
  KVList,
  KVRow,
  DetailGrid,
} from '../components/ui'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ResultCard } from '../components/ResultCard'
import { users, accountActivity, accountReports } from '../data'

export function Users() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const rows = users.filter(
    (u) =>
      u.id.toLowerCase().includes(q.toLowerCase()) ||
      u.email.toLowerCase().includes(q.toLowerCase()),
  )

  return (
    <Page
      title="Users"
      actions={
        <>
          <SearchInput placeholder="Search Users" value={q} onChange={setQ} />
          <FilterButton label="Status" />
        </>
      }
    >
      <Table columns={['User', 'Email', 'Status', 'Last Active']}>
        {rows.map((u) => (
          <Row key={u.id} onClick={() => navigate(`/users/${u.id}`)}>
            <Cell>{u.id}</Cell>
            <Cell className="text-muted">{u.email}</Cell>
            <Cell>
              <StatusText label={u.status} />
            </Cell>
            <Cell className="text-muted">{u.lastActive}</Cell>
          </Row>
        ))}
      </Table>
    </Page>
  )
}

export function AccountActivityCard() {
  return (
    <Card className="overflow-hidden">
      <CardHeader>Activity</CardHeader>
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="bg-thead">
            {['Type', 'Reference', 'When'].map((c) => (
              <th
                key={c}
                className="px-5 py-2.5 text-left text-[9px] font-medium tracking-[0.13em] text-muted uppercase"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {accountActivity.map((a) => (
            <tr key={a.type} className="border-b border-line last:border-0">
              <td className="px-5 py-3 text-ink">{a.type}</td>
              <td className={`px-5 py-3 ${a.accent ? 'text-amber' : 'text-ink'}`}>
                {a.reference}
              </td>
              <td className="px-5 py-3 text-muted">{a.when}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

export function AccountReportsCard() {
  return (
    <Card className="overflow-hidden">
      <CardHeader>Reports Against This Account</CardHeader>
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="bg-thead">
            {['Reason', 'Reported By', 'When'].map((c) => (
              <th
                key={c}
                className="px-5 py-2.5 text-left text-[9px] font-medium tracking-[0.13em] text-muted uppercase"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {accountReports.map((r) => (
            <tr key={r.reason} className="border-b border-line last:border-0">
              <td className="px-5 py-3 text-ink">{r.reason}</td>
              <td className="px-5 py-3 text-muted">{r.reportedBy}</td>
              <td className="px-5 py-3 text-muted">{r.when}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

export function AccountCard({
  id,
  email,
  rows,
  onAction,
}: {
  id: string
  email: string
  rows: { label: string; value: React.ReactNode }[]
  onAction: (kind: 'Suspend' | 'Ban') => void
}) {
  return (
    <Card>
      <CardHeader>Account</CardHeader>
      <div className="p-5">
        <div className="flex items-center gap-3">
          <span className="size-11 rounded-full bg-primary-soft" />
          <div>
            <div className="text-[14px] font-medium text-ink">{id}</div>
            <div className="text-[11px] text-muted">{email}</div>
          </div>
        </div>
        <div className="mt-3">
          <KVList>
            {rows.map((r) => (
              <KVRow key={r.label} label={r.label} value={r.value} />
            ))}
          </KVList>
        </div>
        <div className="mt-4 flex gap-2.5">
          <Button size="sm" variant="outline" onClick={() => onAction('Suspend')}>
            Suspend
          </Button>
          <Button size="sm" variant="danger" onClick={() => onAction('Ban')}>
            Ban
          </Button>
        </div>
      </div>
    </Card>
  )
}

export function UserDetail() {
  const { id = 'User_2481' } = useParams()
  const navigate = useNavigate()
  const user = users.find((u) => u.id === id)
  const [confirm, setConfirm] = useState(false)

  return (
    <Page title={id} breadcrumb="Users">
      <DetailGrid variant="aside-main">
        <AccountCard
          id={id}
          email={user?.email ?? `${id.toLowerCase()}@mail`}
          rows={[
            { label: 'Status', value: <StatusText label={user?.status ?? 'Active'} /> },
            { label: 'Joined', value: '12 Mar 2026' },
            { label: 'Session', value: <span className="text-ok">Active now</span> },
          ]}
          onAction={() => setConfirm(true)}
        />
        <div className="flex flex-col gap-4">
          <AccountActivityCard />
          <AccountReportsCard />
        </div>
      </DetailGrid>

      <ConfirmDialog
        open={confirm}
        spec={{
          title: 'Ban/Suspend User',
          subtitle: `User: ${id}`,
          question: 'Are you sure you want to permanently ban/Suspend this account?',
          context: 'This action will immediately end any active session for this account.',
          confirmLabel: 'Confirm Action',
        }}
        onCancel={() => setConfirm(false)}
        onConfirm={() => navigate(`/users/${id}/applied`)}
      />
    </Page>
  )
}

export function UserActionApplied() {
  const { id = 'User_2481' } = useParams()
  return (
    <Page title="Dashboard">
      <ResultCard
        title="Action applied"
        body={`${id} has been Banned/ Suspended and the active session was terminated immediately. The report is closed and the action was written to the audit log.`}
        actions={[
          { label: 'Back to Dashboard', to: '/' },
          { label: 'Back to Users', to: '/users' },
        ]}
      />
    </Page>
  )
}

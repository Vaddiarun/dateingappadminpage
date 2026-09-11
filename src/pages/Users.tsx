import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
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
  LoadingState,
  ErrorState,
} from '../components/ui'
import { ConfirmDialog, type ConfirmSpec } from '../components/ConfirmDialog'
import { ResultCard } from '../components/ResultCard'
import { getUser, listUsers, setAccountStatus, ApiError } from '../lib/api'
import { useAsync } from '../lib/useAsync'
import { formatDate } from '../lib/format'
import { pick, pickAny, unwrapList, unwrapObject } from '../lib/pick'

type UserRow = { id: string; email: string; status: string; lastActive: string }
export type ActivityItem = { type: string; reference: string; when: string; accent?: boolean }
export type ReportItem = { reason: string; reportedBy: string; when: string }

function toUserRow(u: unknown): UserRow {
  return {
    id: pickAny(u, ['id', '_id'], '—'),
    email: pickAny(u, ['email', 'phone'], '—'),
    status: pick(u, 'status', '—'),
    lastActive: formatDate(pickAny(u, ['lastActive', 'lastActiveAt'], null)),
  }
}

export function Users() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const { data, loading, error, reload } = useAsync(() => listUsers(), [])
  const rows = unwrapList<Record<string, unknown>>(data, 'users')
    .map(toUserRow)
    .filter(
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
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <Table columns={['User', 'Email', 'Status', 'Last Active']}>
          {rows.map((u, i) => (
            <Row key={`${u.id}-${i}`} onClick={() => navigate(`/users/${u.id}`)}>
              <Cell>{u.id}</Cell>
              <Cell className="text-muted">{u.email}</Cell>
              <Cell>
                <StatusText label={u.status} />
              </Cell>
              <Cell className="text-muted">{u.lastActive}</Cell>
            </Row>
          ))}
        </Table>
      )}
    </Page>
  )
}

export function AccountActivityCard({ activity }: { activity: ActivityItem[] }) {
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
          {activity.map((a, i) => (
            <tr key={i} className="border-b border-line last:border-0">
              <td className="px-5 py-3 text-ink">{a.type}</td>
              <td className={`px-5 py-3 ${a.accent ? 'text-amber' : 'text-ink'}`}>
                {a.reference}
              </td>
              <td className="px-5 py-3 text-muted">{a.when}</td>
            </tr>
          ))}
          {activity.length === 0 && (
            <tr>
              <td colSpan={3} className="px-5 py-6 text-center text-muted">
                No recent activity.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Card>
  )
}

export function AccountReportsCard({ reports }: { reports: ReportItem[] }) {
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
          {reports.map((r, i) => (
            <tr key={i} className="border-b border-line last:border-0">
              <td className="px-5 py-3 text-ink">{r.reason}</td>
              <td className="px-5 py-3 text-muted">{r.reportedBy}</td>
              <td className="px-5 py-3 text-muted">{r.when}</td>
            </tr>
          ))}
          {reports.length === 0 && (
            <tr>
              <td colSpan={3} className="px-5 py-6 text-center text-muted">
                No reports filed.
              </td>
            </tr>
          )}
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
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: user, loading, error, reload } = useAsync(() => getUser(id), [id])
  const [confirm, setConfirm] = useState<{ kind: 'Suspend' | 'Ban' } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  if (loading) return <Page title={id} breadcrumb="Users"><LoadingState /></Page>
  if (error) return <Page title={id} breadcrumb="Users"><ErrorState message={error} onRetry={reload} /></Page>

  // The single-record GET wraps the account under `user`, unlike the list endpoint (confirmed live).
  const account = unwrapObject(user, 'user')
  const activity = unwrapList<Record<string, unknown>>(user, 'activity', 'activityFeed').map((a) => ({
    type: pick(a, 'type', '—'),
    reference: pick(a, 'reference', '—'),
    when: formatDate(pick(a, 'when', null)),
    accent: pick(a, 'accent', false),
  }))
  const reports = unwrapList<Record<string, unknown>>(user, 'reportsAgainstAccount', 'reports', 'moderationReports').map((r) => ({
    reason: pick(r, 'reason', '—'),
    reportedBy: pickAny(r, ['reportedBy', 'reporterId'], '—'),
    when: formatDate(pick(r, 'when', null)),
  }))

  const spec: ConfirmSpec | null = confirm
    ? {
        title: `${confirm.kind === 'Ban' ? 'Ban' : 'Suspend'} User`,
        subtitle: `User: ${id}`,
        question: 'Are you sure you want to permanently ban/Suspend this account?',
        context: 'This action will immediately end any active session for this account.',
        reason: true,
        confirmLabel: 'Confirm Action',
      }
    : null

  return (
    <Page title={id} breadcrumb="Users">
      <DetailGrid variant="aside-main">
        <AccountCard
          id={id}
          email={pickAny<string>(account, ['email', 'phone'], '—')}
          rows={[
            { label: 'Status', value: <StatusText label={pick(account, 'status', '—')} /> },
            { label: 'Joined', value: formatDate(pickAny(account, ['createdAt', 'joinedAt'], null)) },
            { label: 'Session', value: <span className="text-ok">Active now</span> },
          ]}
          onAction={(kind) => setConfirm({ kind })}
        />
        <div className="flex flex-col gap-4">
          <AccountActivityCard activity={activity} />
          <AccountReportsCard reports={reports} />
        </div>
      </DetailGrid>

      {actionError && <p className="mt-3 text-[12px] text-danger">{actionError}</p>}

      <ConfirmDialog
        open={confirm !== null}
        spec={spec}
        onCancel={() => setConfirm(null)}
        onConfirm={async (reason) => {
          if (!confirm) return
          setSubmitting(true)
          setActionError(null)
          try {
            await setAccountStatus(id, confirm.kind === 'Ban' ? 'banned' : 'suspended', reason)
            navigate(`/users/${id}/applied?a=${confirm.kind}`)
          } catch (err) {
            setActionError(err instanceof ApiError ? err.message : 'Something went wrong.')
          } finally {
            setSubmitting(false)
            setConfirm(null)
          }
        }}
      />
      {submitting && <LoadingState label="Applying…" />}
    </Page>
  )
}

export function UserActionApplied() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const kind = params.get('a') === 'Ban' ? 'Banned' : 'Suspended'
  return (
    <Page title="Dashboard">
      <ResultCard
        title="Action applied"
        body={`${id} has been ${kind} and the active session was terminated immediately. The report is closed and the action was written to the audit log.`}
        actions={[
          { label: 'Back to Dashboard', to: '/' },
          { label: 'Back to Users', to: '/users' },
        ]}
      />
    </Page>
  )
}

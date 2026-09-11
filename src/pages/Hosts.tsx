import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Page } from '../components/Layout'
import {
  Table,
  Row,
  Cell,
  Card,
  StatusText,
  SearchInput,
  FilterButton,
  Tabs,
  DetailGrid,
  LoadingState,
  ErrorState,
} from '../components/ui'
import { ConfirmDialog, type ConfirmSpec } from '../components/ConfirmDialog'
import { ResultCard } from '../components/ResultCard'
import { TrashIcon, PlayIcon } from '../components/Icon'
import {
  getHost,
  listHosts,
  listHostGallery,
  deleteHostGalleryItem,
  setAccountStatus,
  ApiError,
} from '../lib/api'
import { useAsync } from '../lib/useAsync'
import { formatDate } from '../lib/format'
import { pick, pickAny, unwrapList, unwrapObject } from '../lib/pick'
import { AccountCard, AccountActivityCard, AccountReportsCard } from './Users'

type HostRow = { id: string; email: string; kyc: string; availability: string; status: string; lastActive: string }

function toHostRow(h: unknown): HostRow {
  return {
    id: pickAny(h, ['id', '_id'], '—'),
    email: pickAny(h, ['email', 'phone'], '—'),
    kyc: pickAny(h, ['kycStatus', 'kyc'], '—'),
    // The list endpoint doesn't expose online status (confirmed live) — only the
    // single host GET has `isOnline`, shown on the detail page instead.
    availability: pick(h, 'availability', '—'),
    status: pick(h, 'status', '—'),
    lastActive: formatDate(pickAny(h, ['lastActive', 'lastActiveAt'], null)),
  }
}

export function Hosts() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const { data, loading, error, reload } = useAsync(() => listHosts(), [])
  const rows = unwrapList<Record<string, unknown>>(data, 'hosts')
    .map(toHostRow)
    .filter(
      (h) =>
        h.id.toLowerCase().includes(q.toLowerCase()) ||
        h.email.toLowerCase().includes(q.toLowerCase()),
    )

  return (
    <Page
      title="Hosts"
      actions={
        <>
          <SearchInput placeholder="Search Hosts" value={q} onChange={setQ} />
          <FilterButton label="Status" />
        </>
      }
    >
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <Table columns={['User', 'Email', 'KYC', 'Availability', 'Status', 'Last Active']}>
          {rows.map((h, i) => (
            <Row key={`${h.id}-${i}`} onClick={() => navigate(`/hosts/${h.id}`)}>
              <Cell>{h.id}</Cell>
              <Cell className="text-muted">{h.email}</Cell>
              <Cell>
                <StatusText label={h.kyc} />
              </Cell>
              <Cell>
                <StatusText label={h.availability} />
              </Cell>
              <Cell>
                <StatusText label={h.status} />
              </Cell>
              <Cell className="text-muted">{h.lastActive}</Cell>
            </Row>
          ))}
        </Table>
      )}
    </Page>
  )
}

function Gallery({ hostId }: { hostId: string }) {
  const { data, loading, error, reload } = useAsync(() => listHostGallery(hostId), [hostId])
  const [toDelete, setToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const items = unwrapList<Record<string, unknown>>(data, 'gallery', 'items').map((it) => ({
    id: pick(it, 'id', ''),
    kind: pick<'photo' | 'video'>(it, 'mediaType', 'photo'),
    duration: pick(it, 'duration', ''),
  }))
  const target = items.find((i) => i.id === toDelete)

  return (
    <>
      <Card>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <span className="text-[11px] font-semibold tracking-[0.14em] text-ink uppercase">
            Gallery
          </span>
          <span className="text-[10px] text-muted">
            {items.length} items · photos &amp; videos
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((it) => (
            <div
              key={it.id}
              className="overflow-hidden rounded-[var(--radius-control)] border border-line"
            >
              <div className="relative grid h-24 place-items-center bg-fill text-[10px] text-faint">
                {it.kind === 'video' && (
                  <span className="absolute top-1.5 left-1.5 text-muted">
                    <PlayIcon size={12} />
                  </span>
                )}
                <button
                  onClick={() => setToDelete(it.id)}
                  className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-md border border-danger/40 bg-surface text-danger hover:bg-danger/5"
                >
                  <TrashIcon size={11} />
                </button>
                {it.kind === 'video' ? 'Video thumbnail' : 'Photo thumbnail'}
              </div>
              <div className="border-t border-line px-2 py-1.5 text-[10px] text-muted">
                {it.kind === 'video' ? `Video · ${it.duration}` : 'Photo'}
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <p className="col-span-full py-6 text-center text-[11px] text-muted">No gallery items.</p>
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={toDelete !== null}
        spec={{
          title: target?.kind === 'video' ? 'Delete Video?' : 'Delete Photo?',
          question: `Are you sure you want to delete this ${target?.kind ?? 'item'} from the host's gallery?`,
          context: 'This action cannot be undone.',
          confirmLabel: 'Confirm Action',
        }}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return
          setDeleting(true)
          try {
            await deleteHostGalleryItem(hostId, toDelete)
            reload()
          } finally {
            setDeleting(false)
            setToDelete(null)
          }
        }}
      />
      {deleting && <LoadingState label="Deleting…" />}
    </>
  )
}

export function HostDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: host, loading, error, reload } = useAsync(() => getHost(id), [id])
  const [tab, setTab] = useState('overview')
  const [confirm, setConfirm] = useState<{ kind: 'Suspend' | 'Ban' } | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (loading) return <Page title={id} breadcrumb="Hosts"><LoadingState /></Page>
  if (error) return <Page title={id} breadcrumb="Hosts"><ErrorState message={error} onRetry={reload} /></Page>

  // Confirmed live shape: { user: {...}, hostProfile: {...}, isOnline, activity, reportsAgainstAccount }.
  const account = unwrapObject(host, 'user')
  const isOnline = pick(host, 'isOnline', false)
  const activity = unwrapList<Record<string, unknown>>(host, 'activity', 'activityFeed').map((a) => ({
    type: pick(a, 'type', '—'),
    reference: pick(a, 'reference', '—'),
    when: formatDate(pick(a, 'when', null)),
    accent: pick(a, 'accent', false),
  }))
  const reports = unwrapList<Record<string, unknown>>(host, 'reportsAgainstAccount', 'reports', 'moderationReports').map((r) => ({
    reason: pick(r, 'reason', '—'),
    reportedBy: pickAny(r, ['reportedBy', 'reporterId'], '—'),
    when: formatDate(pick(r, 'when', null)),
  }))

  const spec: ConfirmSpec | null = confirm
    ? {
        title: `${confirm.kind === 'Ban' ? 'Ban' : 'Suspend'} Host`,
        subtitle: `Host: ${id}`,
        question: 'Are you sure you want to permanently ban/Suspend this account?',
        context: 'This action will immediately end any active session for this account.',
        reason: true,
        confirmLabel: 'Confirm Action',
      }
    : null

  return (
    <Page title={id} breadcrumb={`Hosts · ${tab === 'gallery' ? 'Gallery' : 'Overview'}`}>
      <div className="mb-4">
        <Tabs
          tabs={[
            { key: 'overview', label: 'Overview' },
            { key: 'gallery', label: 'Gallery' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'overview' ? (
        <DetailGrid variant="aside-main">
          <AccountCard
            id={id}
            email={pickAny<string>(account, ['email', 'phone'], '—')}
            rows={[
              {
                label: 'Status',
                value: `${pick(account, 'status', '—')} · ${isOnline ? 'Online' : 'Offline'}`,
              },
              { label: 'KYC', value: <StatusText label={pick(account, 'kycStatus', '—')} /> },
              { label: 'Session', value: <span className="text-ok">Active now</span> },
            ]}
            onAction={(kind) => setConfirm({ kind })}
          />
          <div className="flex flex-col gap-4">
            <AccountActivityCard activity={activity} />
            <AccountReportsCard reports={reports} />
          </div>
        </DetailGrid>
      ) : (
        <Gallery hostId={id} />
      )}

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
            navigate(`/hosts/${id}/applied?a=${confirm.kind}`)
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

export function HostActionApplied() {
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
          { label: 'Back to Hosts', to: '/hosts' },
        ]}
      />
    </Page>
  )
}

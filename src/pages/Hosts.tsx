import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
} from '../components/ui'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ResultCard } from '../components/ResultCard'
import { TrashIcon, PlayIcon } from '../components/Icon'
import { hosts, hostGallery } from '../data'
import {
  AccountCard,
  AccountActivityCard,
  AccountReportsCard,
} from './Users'

export function Hosts() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const rows = hosts.filter(
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
      <Table
        columns={['User', 'Email', 'KYC', 'Availability', 'Status', 'Last Active']}
      >
        {rows.map((h) => (
          <Row key={h.id} onClick={() => navigate(`/hosts/${h.id}`)}>
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
    </Page>
  )
}

function Gallery() {
  const [items, setItems] = useState(hostGallery)
  const [toDelete, setToDelete] = useState<string | null>(null)
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
        onConfirm={() => {
          setItems((prev) => prev.filter((i) => i.id !== toDelete))
          setToDelete(null)
        }}
      />
    </>
  )
}

export function HostDetail() {
  const { id = 'Host_0192' } = useParams()
  const navigate = useNavigate()
  const host = hosts.find((h) => h.id === id)
  const [tab, setTab] = useState('overview')
  const [confirm, setConfirm] = useState(false)

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
            email={host?.email ?? `${id.toLowerCase()}@mail`}
            rows={[
              {
                label: 'Status',
                value: `${host?.status ?? 'Active'} · ${host?.availability ?? 'Online'}`,
              },
              { label: 'KYC', value: <StatusText label={host?.kyc ?? 'Approved'} /> },
              { label: 'Session', value: <span className="text-ok">Active now</span> },
            ]}
            onAction={() => setConfirm(true)}
          />
          <div className="flex flex-col gap-4">
            <AccountActivityCard />
            <AccountReportsCard />
          </div>
        </DetailGrid>
      ) : (
        <Gallery />
      )}

      <ConfirmDialog
        open={confirm}
        spec={{
          title: 'Ban/Suspend Host',
          subtitle: `User: ${id}`,
          question: 'Are you sure you want to permanently ban/Suspend this account?',
          context: 'This action will immediately end any active session for this account.',
          confirmLabel: 'Confirm Action',
        }}
        onCancel={() => setConfirm(false)}
        onConfirm={() => navigate(`/hosts/${id}/applied`)}
      />
    </Page>
  )
}

export function HostActionApplied() {
  const { id = 'Host_0192' } = useParams()
  return (
    <Page title="Dashboard">
      <ResultCard
        title="Action applied"
        body={`${id} has been Banned/ Suspended and the active session was terminated immediately. The report is closed and the action was written to the audit log.`}
        actions={[
          { label: 'Back to Dashboard', to: '/' },
          { label: 'Back to Hosts', to: '/hosts' },
        ]}
      />
    </Page>
  )
}

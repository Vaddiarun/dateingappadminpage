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
  ReadonlyField,
  DetailGrid,
  LoadingState,
  ErrorState,
} from '../components/ui'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ResultCard } from '../components/ResultCard'
import { listModerationQueue, resolveModerationReport, ApiError } from '../lib/api'
import { useAsync } from '../lib/useAsync'
import { formatDate } from '../lib/format'
import { pick, pickAny, unwrapList } from '../lib/pick'

const ACTIONS = ['Dismiss', 'Warn', 'Suspend', 'Ban'] as const
type ActionLabel = (typeof ACTIONS)[number]

type ReportRow = { id: string; type: string; reason: string; availability: string; when: string; status: string }

function toReportRow(r: unknown): ReportRow {
  return {
    id: pickAny(r, ['id', '_id', 'reportId'], '—'),
    type: pickAny(r, ['targetType', 'type'], '—'),
    reason: pick(r, 'reason', '—'),
    availability: pick(r, 'availability', '—'),
    when: formatDate(pickAny(r, ['createdAt', 'when'], null)),
    status: pick(r, 'status', 'Open'),
  }
}

export function Moderation() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const { data, loading, error, reload } = useAsync(() => listModerationQueue('pending'), [])
  const rows = unwrapList<Record<string, unknown>>(data, 'reports')
    .map(toReportRow)
    .filter((r) => r.id.toLowerCase().includes(q.toLowerCase()))

  return (
    <Page
      title="Moderations"
      actions={
        <>
          <SearchInput placeholder="Search Reports" value={q} onChange={setQ} />
          <FilterButton label="Status" />
        </>
      }
    >
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <Table columns={['User', 'Type', 'Reason', 'Availability', 'When', 'Status']}>
          {rows.map((r, i) => (
            <Row key={`${r.id}-${i}`} onClick={() => navigate(`/moderation/${encodeURIComponent(r.id)}`)}>
              <Cell>{r.id}</Cell>
              <Cell className="text-muted">{r.type}</Cell>
              <Cell className="text-muted">{r.reason}</Cell>
              <Cell>
                <StatusText label={r.availability} />
              </Cell>
              <Cell className="text-muted">{r.when}</Cell>
              <Cell>
                <StatusText label={r.status} />
              </Cell>
            </Row>
          ))}
        </Table>
      )}
    </Page>
  )
}

export function ModerationDetail() {
  const params = useParams()
  const id = params.id ? decodeURIComponent(params.id) : ''
  const navigate = useNavigate()
  // The list endpoint carries everything the review panel needs; there's no
  // separate GET /admin/moderation/:id in the collection, so re-list and find.
  const { data, loading, error, reload } = useAsync(() => listModerationQueue(), [])
  const report = unwrapList<Record<string, unknown>>(data, 'reports').find(
    (r) => pickAny(r, ['id', '_id', 'reportId'], '') === id,
  )

  const [action, setAction] = useState<ActionLabel>('Dismiss')
  const [confirm, setConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  if (loading) return <Page title={`Report · ${id}`} breadcrumb="Moderation"><LoadingState /></Page>
  if (error) return <Page title={`Report · ${id}`} breadcrumb="Moderation"><ErrorState message={error} onRetry={reload} /></Page>

  return (
    <Page title={`Report · ${id}`} breadcrumb="Moderation">
      <DetailGrid>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>Reported Entity</CardHeader>
            <div className="flex items-center gap-3 p-5">
              <span className="size-9 rounded-full bg-primary-soft" />
              <div>
                <div className="text-[13px] font-medium text-ink">{pickAny(report, ['targetId', 'entity'], id)}</div>
                <div className="text-[11px] text-muted">
                  Entity type: {pickAny(report, ['targetType', 'entityType'], '—')}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>Report</CardHeader>
            <div className="grid grid-cols-2 gap-4 p-5">
              <ReadonlyField label="Reason" value={pick(report, 'reason', '—')} />
              <ReadonlyField label="Reported By" value={pickAny(report, ['reportedBy', 'reporterId'], '—')} />
              <ReadonlyField label="Reported On" value={formatDate(pickAny(report, ['createdAt', 'reportedOn'], null))} />
              <ReadonlyField label="Context" value={pick(report, 'context', '—')} />
              <div className="col-span-2 grid h-40 place-items-center rounded-[var(--radius-control)] border border-dashed border-line bg-fill text-[11px] text-faint">
                Reported content placeholder
              </div>
            </div>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>Action</CardHeader>
          <div className="flex flex-col gap-2 p-5">
            {ACTIONS.map((a) => (
              <label
                key={a}
                className={`flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-control)] border px-3 py-2 text-[12px] ${
                  action === a
                    ? 'border-primary/40 bg-primary-soft text-primary'
                    : 'border-line text-ink'
                }`}
              >
                <input
                  type="radio"
                  name="mod-action"
                  className="accent-primary"
                  checked={action === a}
                  onChange={() => setAction(a)}
                />
                {a}
              </label>
            ))}
            <Button className="mt-1.5" size="sm" onClick={() => setConfirm(true)}>
              Continue
            </Button>
            <p className="text-[10px] text-muted">
              The selected action is written to the audit log.
            </p>
            {actionError && <p className="text-[11px] text-danger">{actionError}</p>}
          </div>
        </Card>
      </DetailGrid>

      <ConfirmDialog
        open={confirm}
        spec={{
          title: 'Confirm moderation action',
          subtitle: `Action: ${action} — ${id}`,
          context:
            action === 'Suspend'
              ? 'Suspension immediately ends any active session for this account.'
              : action === 'Ban'
                ? 'A ban is permanent and terminates the active session.'
                : `The report will be resolved with "${action}".`,
          note: 'This action will be recorded in the audit log.',
          reason: action === 'Dismiss',
          confirmLabel: 'Confirm Action',
        }}
        onCancel={() => setConfirm(false)}
        onConfirm={async (reason) => {
          setSubmitting(true)
          setActionError(null)
          try {
            if (action === 'Dismiss') {
              await resolveModerationReport(id, 'dismissed', { resolutionNote: reason })
            } else {
              await resolveModerationReport(id, 'resolved', {
                accountAction: action.toLowerCase() as 'warn' | 'suspend' | 'ban',
              })
            }
            navigate(`/moderation/${encodeURIComponent(id)}/applied?a=${action}`)
          } catch (err) {
            setActionError(err instanceof ApiError ? err.message : 'Something went wrong.')
          } finally {
            setSubmitting(false)
            setConfirm(false)
          }
        }}
      />
      {submitting && <LoadingState label="Applying…" />}
    </Page>
  )
}

export function ModerationActionApplied() {
  const params = useParams()
  const id = params.id ? decodeURIComponent(params.id) : ''
  const [sp] = useSearchParams()
  const action = sp.get('a') ?? 'Dismissed'
  const verb =
    action === 'Suspend'
      ? 'suspended'
      : action === 'Ban'
        ? 'banned'
        : action === 'Warn'
          ? 'warned'
          : 'dismissed'
  return (
    <Page title="Dashboard">
      <ResultCard
        title="Action applied"
        body={`${id} has been ${verb} and the active session was terminated immediately. The report is closed and the action was written to the audit log.`}
        actions={[
          { label: 'Back to Home', to: '/' },
          { label: 'Back to Moderations', to: '/moderation' },
        ]}
      />
    </Page>
  )
}

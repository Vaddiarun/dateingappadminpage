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
  Note,
  DetailGrid,
  LoadingState,
  ErrorState,
} from '../components/ui'
import { ConfirmDialog, type ConfirmSpec } from '../components/ConfirmDialog'
import { ResultCard } from '../components/ResultCard'
import { CheckIcon } from '../components/Icon'
import { listWithdrawals, getWithdrawal, decideWithdrawal, ApiError } from '../lib/api'
import { useAsync } from '../lib/useAsync'
import { formatDateTime, formatNumber, formatPaise } from '../lib/format'
import { pick, pickAny, unwrapList } from '../lib/pick'

type WithdrawalRow = { id: string; email: string; beans: string; value: string; requested: string; status: string }

function toRow(w: unknown): WithdrawalRow {
  return {
    id: pickAny(w, ['id', '_id', 'hostId', 'host.id'], '—'),
    email: pickAny(w, ['email', 'hostEmail', 'host.email'], '—'),
    beans: formatNumber(pick(w, 'beans', 0)),
    value: formatPaise(pickAny(w, ['payoutValuePaise', 'valuePaise'], 0)),
    requested: formatDateTime(pickAny(w, ['requestedAt', 'createdAt'], null)),
    status: pick(w, 'status', 'Pending'),
  }
}

export function Withdrawals() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const { data, loading, error, reload } = useAsync(() => listWithdrawals('pending'), [])
  const rows = unwrapList<Record<string, unknown>>(data, 'withdrawals')
    .map(toRow)
    .filter(
      (w) =>
        w.id.toLowerCase().includes(q.toLowerCase()) ||
        w.email.toLowerCase().includes(q.toLowerCase()),
    )

  return (
    <Page
      title="Withdrawals"
      actions={
        <>
          <SearchInput placeholder="Search Requests" value={q} onChange={setQ} />
          <FilterButton label="Status" />
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Note>
          Manual review queue — only requests above the configured auto-approval
          threshold appear here.
        </Note>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <Table columns={['User', 'Email', 'Beans', 'Value', 'Requested', 'Status']}>
            {rows.map((w, i) => (
              <Row key={`${w.id}-${i}`} onClick={() => navigate(`/withdrawals/${w.id}`)}>
                <Cell>{w.id}</Cell>
                <Cell className="text-muted">{w.email}</Cell>
                <Cell className="text-muted">{w.beans}</Cell>
                <Cell className="text-ink">{w.value}</Cell>
                <Cell className="text-muted">{w.requested}</Cell>
                <Cell>
                  <StatusText label={w.status} />
                </Cell>
              </Row>
            ))}
          </Table>
        )}
      </div>
    </Page>
  )
}

export function WithdrawalDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: d, loading, error, reload } = useAsync(() => getWithdrawal(id), [id])
  const [confirm, setConfirm] = useState<ConfirmSpec | null>(null)
  const [pendingDecision, setPendingDecision] = useState<'approve' | 'reject' | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  if (loading) return <Page title={`Request · ${id}`} breadcrumb="Withdrawals"><LoadingState /></Page>
  if (error) return <Page title={`Request · ${id}`} breadcrumb="Withdrawals"><ErrorState message={error} onRetry={reload} /></Page>

  const payoutValue = formatPaise(pickAny(d, ['payoutValuePaise', 'valuePaise'], 0))
  const beans = formatNumber(pick(d, 'beans', 0))
  const checks = unwrapList<string | Record<string, unknown>>(d, 'checks', 'verification').map((c) =>
    typeof c === 'string' ? c : pick(c, 'label', String(c)),
  )

  return (
    <Page title={`Request · ${id}`} breadcrumb="Withdrawals">
      <DetailGrid>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>Request</CardHeader>
            <div className="grid grid-cols-2 gap-4 p-5">
              <ReadonlyField label="Host" value={pickAny(d, ['hostId', 'host'], id)} />
              <ReadonlyField label="Requested" value={formatDateTime(pickAny(d, ['requestedAt', 'createdAt'], null))} />
              <ReadonlyField label="Beans" value={beans} />
              <ReadonlyField label="Payout Value" value={`₹ ${payoutValue}`} accent />
              <ReadonlyField label="Withdrawal Slab" value={pick(d, 'slab', '—')} />
              <ReadonlyField
                label="Above Auto-approval Threshold"
                value={pick(d, 'aboveThreshold', pick<string>(d, 'status', '—') === 'pending' ? 'Yes — manual review required' : '—')}
              />
            </div>
          </Card>

          <Card>
            <CardHeader>Verification</CardHeader>
            <div className="flex flex-col p-2">
              {checks.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 border-b border-line px-3 py-2.5 text-[12px] text-ink last:border-0"
                >
                  <span className="grid size-3.5 place-items-center rounded-full border border-ok text-ok">
                    <CheckIcon size={9} />
                  </span>
                  {c}
                </div>
              ))}
              {checks.length === 0 && <p className="px-3 py-4 text-[11px] text-muted">No checklist provided.</p>}
            </div>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>Decision</CardHeader>
          <div className="flex flex-col gap-3 p-5">
            <Note>
              Approving triggers the payout. Rejecting returns the beans to the
              host balance.
            </Note>
            <div className="flex gap-2.5">
              <Button
                size="sm"
                onClick={() => {
                  setPendingDecision('approve')
                  setConfirm({
                    title: 'Approve Withdrawal',
                    question: `Approve ₹ ${payoutValue} for ${id}? This triggers the payout immediately.`,
                    confirmLabel: 'Confirm Action',
                  })
                }}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  setPendingDecision('reject')
                  setConfirm({
                    title: 'Reject Withdrawal',
                    question: `Reject this request? ${beans} beans will be returned to ${id}`,
                    reason: true,
                    confirmLabel: 'Confirm Action',
                  })
                }}
              >
                Reject
              </Button>
            </div>
            {actionError && <p className="text-[11px] text-danger">{actionError}</p>}
          </div>
        </Card>
      </DetailGrid>

      <ConfirmDialog
        open={confirm !== null}
        spec={confirm}
        onCancel={() => {
          setConfirm(null)
          setPendingDecision(null)
        }}
        onConfirm={async (reason) => {
          if (!pendingDecision) return
          setSubmitting(true)
          setActionError(null)
          try {
            await decideWithdrawal(id, pendingDecision, reason)
            navigate(`/withdrawals/${id}/applied?d=${pendingDecision === 'approve' ? 'approved' : 'rejected'}`)
          } catch (err) {
            setActionError(err instanceof ApiError ? err.message : 'Something went wrong.')
          } finally {
            setSubmitting(false)
            setConfirm(null)
          }
        }}
      />
      {submitting && <LoadingState label="Submitting…" />}
    </Page>
  )
}

export function WithdrawalActionApplied() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const approved = (params.get('d') ?? 'approved') === 'approved'
  return (
    <Page title="Dashboard">
      <ResultCard
        title={approved ? 'Payout triggered' : 'Request rejected · beans returned'}
        body={
          approved
            ? `The payout for ${id} has been triggered. This action was written to the audit log.`
            : `The beans were returned to ${id}'s balance. The host can request withdrawal again. This action was written to the audit log.`
        }
        actions={[
          { label: 'Back to Dashboard', to: '/' },
          { label: 'Back to Withdrawal Queue', to: '/withdrawals' },
        ]}
      />
    </Page>
  )
}

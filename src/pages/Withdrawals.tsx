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
} from '../components/ui'
import { ConfirmDialog, type ConfirmSpec } from '../components/ConfirmDialog'
import { ResultCard } from '../components/ResultCard'
import { CheckIcon } from '../components/Icon'
import { withdrawals, withdrawalDetail } from '../data'

export function Withdrawals() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const rows = withdrawals.filter(
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
        <Table
          columns={['User', 'Email', 'Beans', 'Value', 'Requested', 'Status']}
        >
          {rows.map((w) => (
            <Row key={w.id} onClick={() => navigate(`/withdrawals/${w.id}`)}>
              <Cell>{w.id}</Cell>
              <Cell className="text-muted">{w.email}</Cell>
              <Cell className="text-muted">{w.beans}</Cell>
              <Cell className={w.id === 'Host_2481' ? 'text-amber' : 'text-ink'}>
                {w.value}
              </Cell>
              <Cell className="text-muted">{w.requested}</Cell>
              <Cell>
                <StatusText label={w.status} />
              </Cell>
            </Row>
          ))}
        </Table>
      </div>
    </Page>
  )
}

export function WithdrawalDetail() {
  const { id = withdrawalDetail.id } = useParams()
  const navigate = useNavigate()
  const d = withdrawalDetail
  const [confirm, setConfirm] = useState<ConfirmSpec | null>(null)

  return (
    <Page title={`Request · ${id}`} breadcrumb="Withdrawals">
      <DetailGrid>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>Request</CardHeader>
            <div className="grid grid-cols-2 gap-4 p-5">
              <ReadonlyField label="Host" value={id} />
              <ReadonlyField label="Requested" value={d.requested} />
              <ReadonlyField label="Beans" value={d.beans} />
              <ReadonlyField label="Payout Value" value={`₹ ${d.payoutValue}`} accent />
              <ReadonlyField label="Withdrawal Slab" value={d.slab} />
              <ReadonlyField
                label="Above Auto-approval Threshold"
                value={d.aboveThreshold}
              />
            </div>
          </Card>

          <Card>
            <CardHeader>Verification</CardHeader>
            <div className="flex flex-col p-2">
              {d.checks.map((c) => (
                <div
                  key={c}
                  className="flex items-center gap-2.5 border-b border-line px-3 py-2.5 text-[12px] text-ink last:border-0"
                >
                  <span className="grid size-3.5 place-items-center rounded-full border border-ok text-ok">
                    <CheckIcon size={9} />
                  </span>
                  {c}
                </div>
              ))}
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
                onClick={() =>
                  setConfirm({
                    title: 'Approve Withdrawal',
                    question: `Approve ₹ ${d.payoutValue} for ${id}? This triggers the payout immediately.`,
                    confirmLabel: 'Confirm Action',
                  })
                }
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() =>
                  setConfirm({
                    title: 'Reject Withdrawal',
                    question: `Reject this request? ${d.beans} beans will be returned to ${id}`,
                    reason: true,
                    confirmLabel: 'Confirm Action',
                  })
                }
              >
                Reject
              </Button>
            </div>
          </div>
        </Card>
      </DetailGrid>

      <ConfirmDialog
        open={confirm !== null}
        spec={confirm}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          const decision =
            confirm?.title === 'Approve Withdrawal' ? 'approved' : 'rejected'
          navigate(`/withdrawals/${id}/applied?d=${decision}`)
        }}
      />
    </Page>
  )
}

export function WithdrawalActionApplied() {
  const { id = withdrawalDetail.id } = useParams()
  const [params] = useSearchParams()
  const approved = (params.get('d') ?? 'approved') === 'approved'
  const d = withdrawalDetail
  return (
    <Page title="Dashboard">
      <ResultCard
        title={approved ? 'Payout triggered' : 'Request rejected · beans returned'}
        body={
          approved
            ? `₹ ${d.payoutValue} has been sent for payout to ${id}. This action was written to the audit log.`
            : `${d.beans} beans were returned to ${id}'s balance. The host can request withdrawal again. This action was written to the audit log.`
        }
        actions={[
          { label: 'Back to Dashboard', to: '/' },
          { label: 'Back to Withdrawal Queue', to: '/withdrawals' },
        ]}
      />
    </Page>
  )
}

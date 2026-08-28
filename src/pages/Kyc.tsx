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
} from '../components/ui'
import { ConfirmDialog, type ConfirmSpec } from '../components/ConfirmDialog'
import { ResultCard } from '../components/ResultCard'
import { PlusIcon, MinusIcon, RotateIcon } from '../components/Icon'
import { kycSubmissions, kycDocs } from '../data'

export function Kyc() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const rows = kycSubmissions.filter(
    (k) =>
      k.id.toLowerCase().includes(q.toLowerCase()) ||
      k.email.toLowerCase().includes(q.toLowerCase()),
  )

  return (
    <Page
      title="KYC"
      actions={
        <>
          <SearchInput placeholder="Search Submissions" value={q} onChange={setQ} />
          <FilterButton label="Status" />
        </>
      }
    >
      <Table
        columns={['User', 'Email', 'Submitted', 'Documents', 'Attempts', 'Status']}
      >
        {rows.map((k) => (
          <Row key={k.id} onClick={() => navigate(`/kyc/${k.id}`)}>
            <Cell>{k.id}</Cell>
            <Cell className="text-muted">{k.email}</Cell>
            <Cell className="text-muted">{k.submitted}</Cell>
            <Cell className="text-muted">{k.documents}</Cell>
            <Cell className="text-muted">{k.attempts}</Cell>
            <Cell>
              <StatusText label={k.status} />
            </Cell>
          </Row>
        ))}
      </Table>
    </Page>
  )
}

export function KycDetail() {
  const { id = 'Host_1180' } = useParams()
  const navigate = useNavigate()
  const sub = kycSubmissions.find((k) => k.id === id)
  const [viewer, setViewer] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmSpec | null>(null)

  return (
    <Page title={`Submission · ${id}`} breadcrumb="KYC">
      <DetailGrid>
        <Card>
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <span className="text-[11px] font-semibold tracking-[0.14em] text-ink uppercase">
              Submitted Documents
            </span>
            {viewer ? (
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" onClick={() => undefined}>
                  <PlusIcon size={13} />
                </Button>
                <Button size="sm" variant="outline" onClick={() => undefined}>
                  <MinusIcon size={13} />
                </Button>
                <Button size="sm" variant="outline" onClick={() => undefined}>
                  <RotateIcon size={13} /> Rotate
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setViewer(true)}>
                Open viewer
              </Button>
            )}
          </div>

          {viewer ? (
            <div className="p-5">
              <div className="grid min-h-[440px] place-items-center rounded-[var(--radius-control)] border border-line bg-fill text-[11px] text-faint">
                Document preview
              </div>
              <p className="mt-3 text-[11px] text-muted">ID Document — Front</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-5">
              {kycDocs.map((d) => (
                <div key={d.key}>
                  <div className="grid h-36 place-items-center rounded-[var(--radius-control)] border border-line bg-fill text-[11px] text-faint">
                    Document preview
                  </div>
                  <p className="mt-2 text-[11px] text-muted">{d.label}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="h-fit">
          <CardHeader>Submission</CardHeader>
          <div className="p-5">
            {viewer ? (
              <div className="flex flex-col gap-2">
                {kycDocs.map((d) => (
                  <div
                    key={d.key}
                    className="flex items-center gap-2.5 rounded-[var(--radius-control)] border border-line px-3 py-2 text-[12px] text-ink"
                  >
                    <span className="size-5 rounded bg-primary-soft" />
                    {d.chip}
                  </div>
                ))}
              </div>
            ) : (
              <KVList>
                <KVRow label="Host" value={id} />
                <KVRow label="Submitted" value={sub?.submitted ?? '13 Aug 2026'} />
                <KVRow label="Attempt" value={sub?.attempts ?? '1st'} />
                <KVRow
                  label="Status"
                  value={<span className="text-warn">Pending review</span>}
                />
              </KVList>
            )}
            <div className="mt-4 flex gap-2.5">
              <Button
                size="sm"
                onClick={() =>
                  setConfirm({
                    title: 'Approve KYC',
                    subtitle: `Host: ${id}`,
                    question:
                      'Approve this submission? The host account will be unlocked.',
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
                    title: 'Reject KYC',
                    subtitle: `Host: ${id}`,
                    question:
                      'Reject this submission? The host account will be not unlocked.',
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
          const decision = confirm?.title === 'Approve KYC' ? 'approved' : 'rejected'
          navigate(`/kyc/${id}/applied?d=${decision}`)
        }}
      />
    </Page>
  )
}

export function KycActionApplied() {
  const { id = 'Host_1130' } = useParams()
  const [params] = useSearchParams()
  const approved = (params.get('d') ?? 'approved') === 'approved'
  return (
    <Page title="KYC" breadcrumb="KYC">
      <ResultCard
        title={approved ? 'KYC approved' : 'KYC rejected'}
        body={
          approved
            ? `${id} is verified and unlocked. The host can now go online, receive calls and broadcast. This action was written to the audit log.`
            : `${id}'s submission was rejected. The host has been notified to resubmit. This action was written to the audit log.`
        }
        actions={[
          { label: 'Back to Dashboard', to: '/' },
          { label: 'Back to KYC Queue', to: '/kyc' },
        ]}
      />
    </Page>
  )
}

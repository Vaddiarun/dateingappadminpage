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
import { listPendingKyc, getKycSubmission, decideKyc, ApiError } from '../lib/api'
import { useAsync } from '../lib/useAsync'
import { formatDate } from '../lib/format'
import { pick, pickAny, unwrapList } from '../lib/pick'

type KycRow = { id: string; email: string; submitted: string; documents: string; attempts: string; status: string }

function toKycRow(k: unknown): KycRow {
  // Confirmed live shape: { userId, submissionId, email, phone, attemptNumber, submittedAt }.
  // userId is the id /admin/kyc/:hostId expects — submissionId looks like an id too but isn't it.
  const docCount = pick<number | null>(k, 'documentCount', null)
  return {
    id: pickAny(k, ['userId', 'hostId', 'id', '_id'], '—'),
    email: pickAny(k, ['email', 'phone'], '—'),
    submitted: formatDate(pickAny(k, ['submittedAt', 'submitted'], null)),
    documents: docCount === null ? '—' : `${docCount} files`,
    attempts: String(pickAny(k, ['attemptNumber', 'attempt'], 1)),
    status: pick(k, 'status', 'Pending'),
  }
}

export function Kyc() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const { data, loading, error, reload } = useAsync(() => listPendingKyc(), [])
  const rows = unwrapList<Record<string, unknown>>(data, 'submissions', 'pending')
    .map(toKycRow)
    .filter(
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
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <Table columns={['User', 'Email', 'Submitted', 'Documents', 'Attempts', 'Status']}>
          {rows.map((k, i) => (
            <Row key={`${k.id}-${i}`} onClick={() => navigate(`/kyc/${k.id}`)}>
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
      )}
    </Page>
  )
}

export function KycDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: sub, loading, error, reload } = useAsync(() => getKycSubmission(id), [id])
  const [viewer, setViewer] = useState<number | null>(null)
  const [confirm, setConfirm] = useState<ConfirmSpec | null>(null)
  const [pendingDecision, setPendingDecision] = useState<'approve' | 'reject' | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  if (loading) return <Page title={`Submission · ${id}`} breadcrumb="KYC"><LoadingState /></Page>
  if (error) return <Page title={`Submission · ${id}`} breadcrumb="KYC"><ErrorState message={error} onRetry={reload} /></Page>

  const docs = unwrapList<Record<string, unknown>>(sub, 'documents').map((d) => {
    const url = pickAny<string | null>(d, ['documentViewUrl', 'url', 'viewUrl', 'presignedUrl'], null)
    // Presigned S3 URLs carry a query string; check the path, not the whole URL.
    const isPdf = !!url && (() => {
      try {
        return /\.pdf$/i.test(new URL(url).pathname)
      } catch {
        return /\.pdf(\?|$)/i.test(url)
      }
    })()
    return {
      key: pickAny(d, ['documentType', 'key'], 'document'),
      label: pickAny(d, ['label', 'documentType'], 'Document'),
      url,
      isPdf,
    }
  })
  const viewerDoc = viewer !== null ? docs[viewer] : null

  return (
    <Page title={`Submission · ${id}`} breadcrumb="KYC">
      <DetailGrid>
        <Card>
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <span className="text-[11px] font-semibold tracking-[0.14em] text-ink uppercase">
              Submitted Documents
            </span>
            {viewerDoc ? (
              <Button size="sm" variant="outline" onClick={() => setViewer(null)}>
                Back to grid
              </Button>
            ) : (
              docs.length > 0 && (
                <Button size="sm" variant="outline" onClick={() => setViewer(0)}>
                  Open viewer
                </Button>
              )
            )}
          </div>

          {viewerDoc ? (
            <div className="p-5">
              <div className="grid min-h-[440px] place-items-center overflow-hidden rounded-[var(--radius-control)] border border-line bg-fill text-[11px] text-faint">
                {viewerDoc.url ? (
                  viewerDoc.isPdf ? (
                    <iframe src={viewerDoc.url} title={viewerDoc.label} className="h-[440px] w-full" />
                  ) : (
                    <img src={viewerDoc.url} alt={viewerDoc.label} className="max-h-[440px] w-full object-contain" />
                  )
                ) : (
                  'Document preview unavailable'
                )}
              </div>
              <p className="mt-3 text-[11px] text-muted">
                {viewerDoc.label}
                {viewerDoc.url && (
                  <a href={viewerDoc.url} target="_blank" rel="noreferrer" className="ml-2 text-ink underline underline-offset-2 hover:text-primary">
                    Open in new tab
                  </a>
                )}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-5">
              {docs.map((d, i) => (
                <button key={d.key + i} onClick={() => setViewer(i)} className="text-left">
                  <div className="grid h-36 place-items-center overflow-hidden rounded-[var(--radius-control)] border border-line bg-fill text-[11px] text-faint">
                    {d.url ? (
                      d.isPdf ? (
                        'PDF document'
                      ) : (
                        <img src={d.url} alt={d.label} className="h-full w-full object-cover" />
                      )
                    ) : (
                      'Document preview'
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-muted">{d.label}</p>
                </button>
              ))}
              {docs.length === 0 && (
                <p className="col-span-2 py-6 text-center text-[11px] text-muted">No documents submitted.</p>
              )}
            </div>
          )}
        </Card>

        <Card className="h-fit">
          <CardHeader>Submission</CardHeader>
          <div className="p-5">
            <KVList>
              <KVRow label="Host" value={id} />
              <KVRow label="Submitted" value={formatDate(pickAny(sub, ['createdAt', 'submittedAt', 'submitted'], null))} />
              <KVRow label="Attempt" value={String(pickAny(sub, ['attemptNumber', 'attempt'], 1))} />
              <KVRow
                label="Status"
                value={<span className="text-warn">{pick(sub, 'status', 'Pending review')}</span>}
              />
            </KVList>
            <div className="mt-4 flex gap-2.5">
              <Button
                size="sm"
                onClick={() => {
                  setPendingDecision('approve')
                  setConfirm({
                    title: 'Approve KYC',
                    subtitle: `Host: ${id}`,
                    question: 'Approve this submission? The host account will be unlocked.',
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
                    title: 'Reject KYC',
                    subtitle: `Host: ${id}`,
                    question: 'Reject this submission? The host account will be not unlocked.',
                    reason: true,
                    confirmLabel: 'Confirm Action',
                  })
                }}
              >
                Reject
              </Button>
            </div>
            {actionError && <p className="mt-3 text-[11px] text-danger">{actionError}</p>}
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
            await decideKyc(id, pendingDecision, reason)
            navigate(`/kyc/${id}/applied?d=${pendingDecision === 'approve' ? 'approved' : 'rejected'}`)
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

export function KycActionApplied() {
  const { id = '' } = useParams()
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

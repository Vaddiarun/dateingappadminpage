import { useState } from 'react'
import { Page } from '../components/Layout'
import { Table, Row, Cell, SearchInput, FilterButton, LoadingState, ErrorState } from '../components/ui'
import { getAuditLog } from '../lib/api'
import { useAsync } from '../lib/useAsync'
import { formatDateTime } from '../lib/format'
import { pick, pickAny, unwrapList } from '../lib/pick'

function describeEntry(l: Record<string, unknown>): string {
  // Confirmed live shape: { action, targetType, targetId, metadata: '<JSON string>' }.
  const action = pickAny<string>(l, ['action', 'what'], '—')
  const targetType = pick<string | null>(l, 'targetType', null)
  const targetId = pick<string | null>(l, 'targetId', null)
  const target = targetType && targetId ? `${targetType} ${targetId}` : null
  let reason: string | null = null
  const metadataRaw = pick<string | null>(l, 'metadata', null)
  if (metadataRaw) {
    try {
      const parsed = JSON.parse(metadataRaw)
      reason = pickAny<string | null>(parsed, ['reason', 'resolutionNote'], null)
    } catch {
      reason = null
    }
  }
  return [action, target, reason].filter(Boolean).join(' — ')
}

export function AuditLogs() {
  const [q, setQ] = useState('')
  const { data, loading, error, reload } = useAsync(() => getAuditLog({ limit: 50 }), [])
  const rows = unwrapList<Record<string, unknown>>(data, 'entries', 'logs')
    .map((l) => ({
      who: pickAny<string>(l, ['adminEmail', 'adminId', 'who'], '—'),
      what: describeEntry(l),
      when: formatDateTime(pickAny(l, ['createdAt', 'when'], null)),
    }))
    .filter(
      (l) =>
        l.what.toLowerCase().includes(q.toLowerCase()) ||
        l.who.toLowerCase().includes(q.toLowerCase()),
    )

  return (
    <Page
      title="Audit Logs"
      actions={
        <>
          <SearchInput placeholder="Search Users" value={q} onChange={setQ} />
          <FilterButton label="Admin" />
          <FilterButton label="Date" />
        </>
      }
    >
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <Table columns={['Who', 'What', 'When']}>
          {rows.map((l, i) => (
            <Row key={i}>
              <Cell className="text-ink">{l.who}</Cell>
              <Cell className="text-muted">{l.what}</Cell>
              <Cell className="text-muted">{l.when}</Cell>
            </Row>
          ))}
          {rows.length === 0 && (
            <Row>
              <Cell className="text-muted">No audit entries.</Cell>
              <Cell />
              <Cell />
            </Row>
          )}
        </Table>
      )}
    </Page>
  )
}

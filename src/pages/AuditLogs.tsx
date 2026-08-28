import { useState } from 'react'
import { Page } from '../components/Layout'
import { Table, Row, Cell, SearchInput, FilterButton } from '../components/ui'
import { auditLogs } from '../data'

export function AuditLogs() {
  const [q, setQ] = useState('')
  const rows = auditLogs.filter(
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
      <Table columns={['Who', 'What', 'When']}>
        {rows.map((l, i) => (
          <Row key={i}>
            <Cell className="text-ink">{l.who}</Cell>
            <Cell className="text-muted">{l.what}</Cell>
            <Cell className="text-muted">{l.when}</Cell>
          </Row>
        ))}
      </Table>
    </Page>
  )
}

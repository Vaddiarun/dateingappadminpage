import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Page } from '../components/Layout'
import { Table, Row, Cell, Card, CardHeader, LoadingState, ErrorState } from '../components/ui'
import { PreviewBanner, Pill, Select, EmptyRow, useLoaded } from '../components/ops'
import { listSecurityEvents } from '../lib/ops'
import { formatDateTime, humanize } from '../lib/format'
import { pick, unwrapList } from '../lib/pick'

const TYPES = ['all', 'SCREENSHOT_ATTEMPT', 'SCREEN_RECORDING_SUSPECTED', 'PAGE_HIDDEN', 'DEVTOOLS_OPENED']

export function Security() {
  const navigate = useNavigate()
  const [role, setRole] = useState('all')
  const [type, setType] = useState('all')
  const { data, preview, loading, error, reload } = useLoaded(
    () => listSecurityEvents({ role: role === 'all' ? undefined : role, type: type === 'all' ? undefined : type }),
    [role, type],
  )
  const events = unwrapList<Record<string, unknown>>(data, 'events')
  const offenders = unwrapList<Record<string, unknown>>(data, 'repeatOffenders')
  const profile = (r: Record<string, unknown>) =>
    navigate(`/${pick<string>(r, 'role', 'user') === 'host' ? 'hosts' : 'users'}/${encodeURIComponent(pick<string>(r, 'accountId', ''))}`)

  return (
    <Page
      title="Security Events"
      breadcrumb="Screenshot & recording attempts"
      actions={
        <>
          <Select label="Account" value={role} onChange={setRole} options={[{ value: 'all', label: 'All' }, { value: 'user', label: 'Users' }, { value: 'host', label: 'Hosts' }]} />
          <Select label="Event" value={type} onChange={setType} options={TYPES.map((t) => ({ value: t, label: t === 'all' ? 'All' : humanize(t) }))} />
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {preview && <PreviewBanner what="security events" />}
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
            <Table columns={['When', 'Event', 'Account', 'During']}>
              {events.map((e) => {
                const t = pick<string>(e, 'type', '')
                return (
                  <Row key={pick<string>(e, 'id', '')} onClick={() => profile(e)}>
                    <Cell className="text-muted">{formatDateTime(pick(e, 'createdAt', null))}</Cell>
                    <Cell><Pill label={humanize(t)} tone={t === 'PAGE_HIDDEN' ? 'neutral' : 'danger'} /></Cell>
                    <Cell>
                      {pick(e, 'accountName', pick<string>(e, 'accountId', '—'))} <span className="text-[10px] text-faint">· {pick<string>(e, 'role', '')}</span>
                    </Cell>
                    <Cell className="text-muted">{humanize(pick<string>(e, 'context', ''))} {pick<string>(e, 'contextId', '')}</Cell>
                  </Row>
                )
              })}
              {events.length === 0 && <EmptyRow cols={4} label="No security events." />}
            </Table>

            <Card className="h-fit">
              <CardHeader>Repeat offenders</CardHeader>
              <div className="flex flex-col p-3">
                {offenders.map((o) => (
                  <button
                    key={pick<string>(o, 'accountId', '')}
                    onClick={() => profile(o)}
                    className="flex items-center justify-between rounded-[var(--radius-control)] px-2 py-2 text-left text-[12px] hover:bg-fill"
                  >
                    <span>
                      {pick<string>(o, 'accountName', '—')} <span className="text-[10px] text-faint">· {pick<string>(o, 'role', '')}</span>
                    </span>
                    <Pill label={`${pick(o, 'count', 0)} events`} tone="danger" />
                  </button>
                ))}
                {offenders.length === 0 && <p className="px-2 py-3 text-[11px] text-muted">No account has 3 or more events.</p>}
                <p className="px-2 pt-2 text-[10px] leading-4 text-muted">Accounts with 3+ events. Open one to warn, suspend or ban.</p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Page>
  )
}

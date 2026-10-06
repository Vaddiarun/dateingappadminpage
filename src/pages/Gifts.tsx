import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Page } from '../components/Layout'
import { Table, Row, Cell, Tabs, LoadingState, ErrorState } from '../components/ui'
import { PreviewBanner, Pill, Select, StatTile, EmptyRow, useLoaded } from '../components/ops'
import { listGiftTransactions, listGiftRequests } from '../lib/ops'
import { formatNumber, formatPaise, humanize, timeAgo } from '../lib/format'
import { pick, unwrapList } from '../lib/pick'

export function Gifts() {
  const [tab, setTab] = useState('sent')
  return (
    <Page title="Gift Activity">
      <div className="flex flex-col gap-4">
        <Tabs tabs={[{ key: 'sent', label: 'Gifts sent' }, { key: 'requests', label: 'Gift requests' }]} active={tab} onChange={setTab} />
        {tab === 'sent' ? <GiftTransactions /> : <GiftRequests />}
      </div>
    </Page>
  )
}

function GiftTransactions() {
  const navigate = useNavigate()
  const [context, setContext] = useState('all')
  const { data, preview, loading, error, reload } = useLoaded(() => listGiftTransactions({ context: context === 'all' ? undefined : context }), [context])
  const rows = unwrapList<Record<string, unknown>>(data, 'transactions')
  const revenue = rows.reduce((a, t) => a + pick(t, 'pricePaise', 0), 0)
  const beans = rows.reduce((a, t) => a + pick(t, 'beans', 0), 0)

  return (
    <>
      {preview && <PreviewBanner what="gift history" />}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Gifts in view" value={formatNumber(rows.length)} />
        <StatTile label="Spent by users" value={`₹ ${formatPaise(revenue)}`} tone="amber" />
        <StatTile label="Beans to hosts" value={formatNumber(beans)} />
      </div>
      <div>
        <Select
          label="Sent during"
          value={context}
          onChange={setContext}
          options={[{ value: 'all', label: 'Anywhere' }, { value: 'call', label: 'Calls' }, { value: 'live', label: 'Live' }, { value: 'chat', label: 'Chat' }]}
        />
      </div>
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <Table columns={['When', 'Gift', 'From user', 'To host', 'During', 'Price', 'Beans']}>
          {rows.map((t) => (
            <Row key={pick<string>(t, 'id', '')} onClick={() => navigate(`/users/${encodeURIComponent(pick<string>(t, 'senderId', ''))}`)}>
              <Cell className="text-muted">{timeAgo(pick(t, 'createdAt', null))}</Cell>
              <Cell>{pick<string>(t, 'giftName', '—')}</Cell>
              <Cell>{pick<string>(t, 'senderName', '—')}</Cell>
              <Cell>{pick<string>(t, 'hostName', '—')}</Cell>
              <Cell><Pill label={humanize(pick<string>(t, 'context', ''))} /></Cell>
              <Cell className="text-amber">₹ {formatPaise(pick(t, 'pricePaise', 0))}</Cell>
              <Cell>{formatNumber(pick(t, 'beans', 0))}</Cell>
            </Row>
          ))}
          {rows.length === 0 && <EmptyRow cols={7} label="No gifts in this view." />}
        </Table>
      )}
    </>
  )
}

function GiftRequests() {
  const [status, setStatus] = useState('all')
  const { data, preview, loading, error, reload } = useLoaded(() => listGiftRequests({ status: status === 'all' ? undefined : status }), [status])
  const rows = unwrapList<Record<string, unknown>>(data, 'requests')
  const accepted = rows.filter((r) => pick<string>(r, 'status', '') === 'accepted').length
  const decided = rows.filter((r) => pick<string>(r, 'status', '') !== 'pending').length

  return (
    <>
      {preview && <PreviewBanner what="gift requests" />}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Requests" value={formatNumber(rows.length)} />
        <StatTile label="Accepted" value={formatNumber(accepted)} tone="ok" />
        <StatTile label="Acceptance rate" value={decided ? `${Math.round((accepted / decided) * 100)}%` : '—'} sub="Of requests users answered" />
      </div>
      <div>
        <Select
          label="Status"
          value={status}
          onChange={setStatus}
          options={['all', 'pending', 'accepted', 'declined'].map((s) => ({ value: s, label: s === 'all' ? 'All' : humanize(s) }))}
        />
      </div>
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <Table columns={['When', 'Host', 'Asked user', 'Suggested gift', 'Note', 'Status']}>
          {rows.map((r) => {
            const s = pick<string>(r, 'status', '')
            return (
              <Row key={pick<string>(r, 'id', '')}>
                <Cell className="text-muted">{timeAgo(pick(r, 'createdAt', null))}</Cell>
                <Cell>{pick<string>(r, 'hostName', '—')}</Cell>
                <Cell>{pick<string>(r, 'userName', '—')}</Cell>
                <Cell>{pick<string>(r, 'suggestedGiftName', '—')}</Cell>
                <Cell className="max-w-[240px] truncate text-muted">{pick<string>(r, 'note', '—')}</Cell>
                <Cell><Pill label={humanize(s)} tone={s === 'accepted' ? 'ok' : s === 'declined' ? 'danger' : 'warn'} /></Cell>
              </Row>
            )
          })}
          {rows.length === 0 && <EmptyRow cols={6} label="No gift requests in this view." />}
        </Table>
      )}
    </>
  )
}

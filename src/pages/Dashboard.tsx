import { Page } from '../components/Layout'
import { Card, CardHeader, Label, Badge, FilterButton, LoadingState, ErrorState } from '../components/ui'
import { getDashboard } from '../lib/api'
import { useAsync } from '../lib/useAsync'
import { formatNumber, formatPaise } from '../lib/format'
import { pick, pickAny, unwrapList } from '../lib/pick'

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub?: string
  accent?: boolean
}) {
  return (
    <Card className="px-5 py-4">
      <Label>{label}</Label>
      <div
        className={`mt-2 text-[22px] leading-tight font-medium ${
          accent ? 'text-amber' : 'text-ink'
        }`}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-[10px] text-muted">{sub}</div>}
    </Card>
  )
}

function RevenueChart({ series }: { series: number[] }) {
  const max = Math.max(1, ...series)
  return (
    <div className="rounded-[var(--radius-control)] bg-primary-soft/50 px-6 pt-8 pb-3">
      <div className="flex h-40 items-end gap-3">
        {series.map((v, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-[3px] bg-[#c9b8ec]"
            style={{ height: `${(v / max) * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-2 border-t border-primary/15" />
    </div>
  )
}

type TopHost = { host: string; earnings: string; minutes: string; status: string }

export function Dashboard() {
  const { data, loading, error, reload } = useAsync(() => getDashboard(), [])

  if (loading) return <Page title="Dashboard"><LoadingState /></Page>
  if (error) return <Page title="Dashboard"><ErrorState message={error} onRetry={reload} /></Page>

  const series = unwrapList<Record<string, unknown>>(data, 'series', 'daily').map((row) =>
    pickAny<number>(row, ['revenuePaise', 'revenue', 'value'], 0),
  )
  const topEarningHosts: TopHost[] = unwrapList<Record<string, unknown>>(data, 'topEarningHosts').map((h) => ({
    host: pickAny(h, ['hostId', 'host', 'id'], '—'),
    earnings: formatPaise(pickAny(h, ['earningsPaise', 'earnings'], 0)),
    minutes: formatNumber(pickAny(h, ['minutes', 'callMinutes'], 0)),
    status: pickAny(h, ['status'], 'Active'),
  }))

  return (
    <Page title="Dashboard">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-4">
          <Stat
            label="Revenue"
            value={`₹ ${formatPaise(pickAny(data, ['revenuePaise', 'revenue'], 0))}`}
            sub="Selected period"
            accent
          />
          <Stat label="Active Users" value={formatNumber(pick(data, 'activeUsers', 0))} />
          <Stat label="Active Hosts" value={formatNumber(pick(data, 'activeHosts', 0))} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Stat label="Total Call Minutes" value={formatNumber(pick(data, 'totalCallMinutes', 0))} />
          <Stat
            label="Commission Collected"
            value={`₹ ${formatPaise(pickAny(data, ['commissionCollectedPaise', 'commissionCollected'], 0))}`}
            accent
          />
        </div>

        <Card>
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <span className="text-[11px] font-semibold tracking-[0.14em] text-ink uppercase">
              Revenue / Activity
            </span>
            <FilterButton label="Last 30 days" />
          </div>
          <div className="p-5">
            <RevenueChart series={series.length ? series : [0]} />
            <p className="mt-3 text-[10px] text-muted">
              Revenue (bars) · call minutes (secondary series)
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader>Top-earning Hosts</CardHeader>
          <div className="p-3">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-thead">
                  {['Host', 'Earnings', 'Call Minutes', 'Status'].map((c) => (
                    <th
                      key={c}
                      className="px-4 py-2.5 text-left text-[9px] font-medium tracking-[0.13em] text-muted uppercase"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topEarningHosts.map((h, i) => (
                  <tr key={h.host + i} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 text-ink">{h.host}</td>
                    <td className="px-4 py-3 text-amber">₹ {h.earnings}</td>
                    <td className="px-4 py-3 text-ink">{h.minutes}</td>
                    <td className="px-4 py-3">
                      <Badge label={h.status} />
                    </td>
                  </tr>
                ))}
                {topEarningHosts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-muted">
                      No data for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Page>
  )
}

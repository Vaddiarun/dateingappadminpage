import { Page } from '../components/Layout'
import { Card, CardHeader, Label, Badge, FilterButton } from '../components/ui'
import {
  dashboardStats,
  revenueSeries,
  topEarningHosts,
} from '../data'

function Stat({
  label,
  value,
  sub,
  accent,
  wide,
}: {
  label: string
  value: string
  sub?: string
  accent?: boolean
  wide?: boolean
}) {
  return (
    <Card className={`px-5 py-4 ${wide ? '' : ''}`}>
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

function RevenueChart() {
  return (
    <div className="rounded-[var(--radius-control)] bg-primary-soft/50 px-6 pt-8 pb-3">
      <div className="flex h-40 items-end gap-3">
        {revenueSeries.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-[3px] bg-[#c9b8ec]"
            style={{ height: `${h * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-2 border-t border-primary/15" />
    </div>
  )
}

export function Dashboard() {
  return (
    <Page title="Dashboard">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-4">
          <Stat
            label="Revenue"
            value={`₹ ${dashboardStats.revenue}`}
            sub="Selected period"
            accent
          />
          <Stat label="Active Users" value={dashboardStats.activeUsers} />
          <Stat label="Active Hosts" value={dashboardStats.activeHosts} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Stat label="Total Call Minutes" value={dashboardStats.totalCallMinutes} />
          <Stat
            label="Commission Collected"
            value={`₹ ${dashboardStats.commissionCollected}`}
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
            <RevenueChart />
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
                {topEarningHosts.map((h) => (
                  <tr key={h.host} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 text-ink">{h.host}</td>
                    <td className="px-4 py-3 text-amber">₹ {h.earnings}</td>
                    <td className="px-4 py-3 text-ink">{h.minutes}</td>
                    <td className="px-4 py-3">
                      <Badge label={h.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Page>
  )
}

import { useNavigate } from 'react-router-dom'
import { Page } from '../components/Layout'
import { Card, Button, LoadingState, ErrorState } from '../components/ui'
import {
  listCommissionConfig,
  getBeansRateConfig,
  getWithdrawalSlabsConfig,
  getWithdrawalPolicyConfig,
  listGiftsAdmin,
} from '../lib/api'
import { useAsync } from '../lib/useAsync'
import { latestBatch, latestByGroup, latestConfig } from '../lib/configHistory'
import { formatBasisPoints, formatPaise } from '../lib/format'
import { pick, unwrapList } from '../lib/pick'

type PricingCardData = { key: string; title: string; summary: string; action: 'Open'; to: string; accent?: boolean }

export function Pricing() {
  const navigate = useNavigate()
  const { data, loading, error, reload } = useAsync(
    () =>
      Promise.all([
        listCommissionConfig(),
        getBeansRateConfig(),
        getWithdrawalSlabsConfig(),
        getWithdrawalPolicyConfig(),
        listGiftsAdmin(),
      ]),
    [],
  )

  if (loading) return <Page title="Pricing & Economics"><LoadingState /></Page>
  if (error) return <Page title="Pricing & Economics"><ErrorState message={error} onRetry={reload} /></Page>

  const [commissionRes, beansRes, slabsRes, policyRes, giftsRes] = data!
  const commissionConfigs = unwrapList<Record<string, unknown>>(commissionRes, 'configs')
  const byHost = latestByGroup(commissionConfigs, (c) => pick(c, 'hostId', '') || 'global')
  const global = byHost.get('global')
  const overrideCount = [...byHost.keys()].filter((k) => k !== 'global').length

  const beansConfig = latestConfig(unwrapList<Record<string, unknown>>(beansRes, 'configs'))
  const slabCount = latestBatch(unwrapList<Record<string, unknown>>(slabsRes, 'configs')).length
  const policy = latestConfig(unwrapList<Record<string, unknown>>(policyRes, 'configs'))
  const gifts = unwrapList<Record<string, unknown>>(giftsRes, 'gifts')
  const activeGifts = gifts.filter((g) => pick(g, 'active', true)).length

  const cards: PricingCardData[] = [
    {
      key: 'commission',
      title: 'Commission Configuration',
      summary: global ? `Global ${formatBasisPoints(pick(global, 'basisPoints', 0))}%` : 'Not configured',
      action: 'Open',
      to: '/pricing/commission',
    },
    {
      key: 'override',
      title: 'Host Commission Override',
      summary: `${overrideCount} host${overrideCount === 1 ? '' : 's'} overridden`,
      action: 'Open',
      to: '/pricing/host-override',
    },
    {
      key: 'beans',
      title: 'Beans Earn-rate',
      summary: beansConfig ? `1 bean = ₹ ${formatPaise(pick(beansConfig, 'paisePerBean', 0))}` : 'Not configured',
      action: 'Open',
      to: '/pricing/beans-earn-rate',
      accent: true,
    },
    {
      key: 'slabs',
      title: 'Withdrawal Slabs',
      summary: `${slabCount} slab${slabCount === 1 ? '' : 's'}`,
      action: 'Open',
      to: '/pricing/withdrawal-slabs',
    },
    {
      key: 'gifts',
      title: 'Gift Catalog',
      summary: `${gifts.length} gifts · ${activeGifts} active`,
      action: 'Open',
      to: '/pricing/gift-catalog',
    },
    {
      key: 'min',
      title: 'Minimum Withdrawal Amount',
      summary: policy ? `₹ ${formatPaise(pick(policy, 'minAmountPaise', 0))}` : 'Not configured',
      action: 'Open',
      to: '/pricing/minimum-withdrawal',
    },
    {
      key: 'threshold',
      title: 'Auto-approval Threshold',
      summary: policy ? `₹ ${formatPaise(pick(policy, 'autoApproveThresholdPaise', 0))}` : 'Not configured',
      action: 'Open',
      to: '/pricing/auto-approval',
    },
  ]

  return (
    <Page title="Pricing & Economics">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.key} className="flex flex-col gap-3 p-5">
            <div className="text-[11px] font-semibold tracking-[0.13em] text-ink uppercase">
              {c.title}
            </div>
            <div className={`text-[11px] ${c.accent ? 'text-amber' : 'text-muted'}`}>
              {c.summary}
            </div>
            <div>
              <Button size="sm" variant="outline" onClick={() => navigate(c.to)}>
                {c.action}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </Page>
  )
}

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Page } from '../components/Layout'
import {
  Card,
  CardHeader,
  Button,
  Field,
  Input,
  Note,
  Label,
  ReadonlyField,
  Table,
  Row,
  Cell,
  StatusText,
} from '../components/ui'
import { ConfirmDialog, type ConfirmSpec } from '../components/ConfirmDialog'
import { ResultCard } from '../components/ResultCard'
import {
  hostCommissionOverrides,
  withdrawalSlabs,
  gifts,
} from '../data'

const CHANGE_CONTEXT = 'Effective from now. Completed transactions and past payouts are not changed.'

/* ---------- Commission Configuration ---------- */

export function CommissionConfig() {
  const navigate = useNavigate()
  const [global, setGlobal] = useState('30')
  const [override, setOverride] = useState('')
  const [confirm, setConfirm] = useState(false)

  return (
    <Page title="Commission Configuration" breadcrumb="Pricing & Economics">
      <Card>
        <CardHeader>Commission</CardHeader>
        <div className="flex max-w-[520px] flex-col gap-4 p-5">
          <Field label="Global Commission %">
            <Input value={global} onChange={(e) => setGlobal(e.target.value)} inputMode="numeric" />
          </Field>
          <Field label="Optional Host Override %">
            <Input
              value={override}
              onChange={(e) => setOverride(e.target.value)}
              inputMode="numeric"
            />
          </Field>
          <div>
            <Button size="sm" onClick={() => setConfirm(true)}>
              Save
            </Button>
          </div>
          <Note>New configuration applies from the moment it is saved.</Note>
        </div>
      </Card>

      <ConfirmDialog
        open={confirm}
        spec={{
          title: 'Confirm moderation action',
          compare: [
            { label: 'Previous', value: '30%' },
            { label: 'New', value: `${global || '0'}%` },
          ],
          context: CHANGE_CONTEXT,
          confirmLabel: 'Confirm Action',
        }}
        onCancel={() => setConfirm(false)}
        onConfirm={() => navigate('/pricing/commission/success')}
      />
    </Page>
  )
}

export function ConfigurationUpdated() {
  return (
    <Page title="Commission Configuration" breadcrumb="Pricing & Economics">
      <ResultCard
        title="Configuration updated"
        body="The new configuration is effective from now. Completed transactions are unchanged. This action was written to the audit log."
        actions={[
          { label: 'Back to Dashboard', to: '/' },
          { label: 'Back to Pricing & Economics', to: '/pricing' },
        ]}
      />
    </Page>
  )
}

/* ---------- Beans Earn-rate ---------- */

export function BeansEarnRate() {
  const navigate = useNavigate()
  const [minutes, setMinutes] = useState('1')
  const [beans, setBeans] = useState('40')
  const [confirm, setConfirm] = useState(false)

  return (
    <Page title="Beans Earn-rate" breadcrumb="Pricing & Economics">
      <Card>
        <CardHeader>Earn-rate</CardHeader>
        <div className="flex max-w-[520px] flex-col gap-4 p-5">
          <div className="flex flex-col gap-1.5">
            <Label>Current configuration</Label>
            <div className="flex h-10 items-center gap-2 rounded-[var(--radius-control)] bg-fill px-3 text-[12px] text-amber">
              <input
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="w-8 bg-transparent text-center outline-none"
                inputMode="numeric"
              />
              call minute =
              <input
                value={beans}
                onChange={(e) => setBeans(e.target.value)}
                className="w-10 bg-transparent text-center outline-none"
                inputMode="numeric"
              />
              beans
            </div>
          </div>
          <div>
            <Button size="sm" onClick={() => setConfirm(true)}>
              Save
            </Button>
          </div>
          <Note>Effective from now. Completed transactions are not recalculated.</Note>
        </div>
      </Card>

      <ConfirmDialog
        open={confirm}
        spec={{
          title: 'Confirm moderation action',
          compare: [
            { label: 'Previous', value: '1 min = 40 beans' },
            { label: 'New', value: `${minutes || '1'} min = ${beans || '0'} beans` },
          ],
          context: 'Effective from now. Completed transactions are not recalculated.',
          confirmLabel: 'Confirm Action',
        }}
        onCancel={() => setConfirm(false)}
        onConfirm={() => navigate('/pricing/beans-earn-rate/success')}
      />
    </Page>
  )
}

/* ---------- Current / New numeric config (Min withdrawal, Auto-approval) ---------- */

type NumConfig = {
  title: string
  cardTitle: string
  currentLabel: string
  newLabel: string
  newPlaceholder: string
  current: string
  note?: string
}

const NUM_CONFIG: Record<string, NumConfig> = {
  'minimum-withdrawal': {
    title: 'Minimum Withdrawal Amount',
    cardTitle: 'Minimum Withdrawal',
    currentLabel: 'Current minimum',
    newLabel: 'New minimum',
    newPlaceholder: '₹ 1,000',
    current: '₹ 1,000',
  },
  'auto-approval': {
    title: 'Auto-Approval Threshold',
    cardTitle: 'Auto-approval',
    currentLabel: 'Current threshold',
    newLabel: 'New threshold',
    newPlaceholder: 'Enter Threshold',
    current: '₹ 1,000',
    note: 'Requests at or below the threshold are auto-approved. Requests above it enter the manual Withdrawals queue.',
  },
}

export function NumericConfig({ configKey }: { configKey: string }) {
  const navigate = useNavigate()
  const cfg = NUM_CONFIG[configKey]
  const [value, setValue] = useState('')
  const [confirm, setConfirm] = useState(false)

  if (!cfg) return <NotFoundConfig />

  return (
    <Page title={cfg.title} breadcrumb="Pricing & Economics">
      <Card>
        <CardHeader>{cfg.cardTitle}</CardHeader>
        <div className="flex flex-col gap-4 p-5">
          <div className="max-w-[520px]">
            <ReadonlyField label={cfg.currentLabel} value={cfg.current} />
          </div>
          <div className="max-w-[520px]">
            <Field label={cfg.newLabel}>
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={cfg.newPlaceholder}
              />
            </Field>
          </div>
          {cfg.note && <div className="max-w-[520px]"><Note>{cfg.note}</Note></div>}
          <div>
            <Button size="sm" onClick={() => setConfirm(true)}>
              Save
            </Button>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={confirm}
        spec={{
          title: 'Confirm moderation action',
          compare: [
            { label: 'Previous', value: cfg.current },
            { label: 'New', value: value || '—' },
          ],
          context: CHANGE_CONTEXT,
          confirmLabel: 'Confirm Action',
        }}
        onCancel={() => setConfirm(false)}
        onConfirm={() => navigate('/pricing/config-updated')}
      />
    </Page>
  )
}

export function ConfigUpdatedGeneric() {
  return (
    <Page title="Pricing & Economics" breadcrumb="Pricing & Economics">
      <ResultCard
        title="Configuration updated"
        body="The new configuration is effective from now. Completed transactions are unchanged. This action was written to the audit log."
        actions={[
          { label: 'Back to Dashboard', to: '/' },
          { label: 'Back to Pricing & Economics', to: '/pricing' },
        ]}
      />
    </Page>
  )
}

/* ---------- Host Commission Override ---------- */

export function HostCommissionOverride() {
  return (
    <Page title="Host Commission Override" breadcrumb="Pricing & Economics">
      <div className="flex flex-col gap-4">
        <Table columns={['Host', 'Global %', 'Override %', 'Effective From']}>
          {hostCommissionOverrides.map((o) => (
            <Row key={o.host}>
              <Cell>{o.host}</Cell>
              <Cell className="text-muted">{o.global}</Cell>
              <Cell className="text-muted">{o.override}</Cell>
              <Cell className="text-muted">{o.effectiveFrom}</Cell>
            </Row>
          ))}
        </Table>
        <div>
          <Button size="sm" variant="outline">
            Add overrides
          </Button>
        </div>
      </div>
    </Page>
  )
}

/* ---------- Withdrawal Slabs ---------- */

export function WithdrawalSlabs() {
  return (
    <Page title="Withdrawal Slabs" breadcrumb="Pricing & Economics">
      <div className="flex flex-col gap-4">
        <Table columns={['Slab', 'Beans Range', 'Value']}>
          {withdrawalSlabs.map((s) => (
            <Row key={s.slab}>
              <Cell>{s.slab}</Cell>
              <Cell className="text-muted">{s.range}</Cell>
              <Cell className="text-muted">{s.value}</Cell>
            </Row>
          ))}
        </Table>
        <div>
          <Button size="sm" variant="outline">
            Add Slab
          </Button>
        </div>
      </div>
    </Page>
  )
}

/* ---------- Gift Catalog ---------- */

export function GiftCatalog() {
  const navigate = useNavigate()
  return (
    <Page title="Gift Catalog" breadcrumb="Pricing & Economics">
      <div className="flex flex-col gap-4">
        <Table columns={['Icon', 'Gift', 'Price / Beans', 'Status', '']}>
          {gifts.map((g) => (
            <Row key={g.id}>
              <Cell>
                <span className="inline-block size-6 rounded bg-primary-soft" />
              </Cell>
              <Cell>{g.name}</Cell>
              <Cell className="text-muted">{g.price}</Cell>
              <Cell>
                <StatusText label={g.status} />
              </Cell>
              <Cell className="text-right">
                <button
                  onClick={() => navigate(`/pricing/gift-catalog/${g.id}/edit`)}
                  className="text-[11px] text-ink underline underline-offset-2 hover:text-primary"
                >
                  EDIT
                </button>
              </Cell>
            </Row>
          ))}
        </Table>
        <div>
          <Button size="sm" variant="outline">
            Add Gifts
          </Button>
        </div>
      </div>
    </Page>
  )
}

export function EditGift() {
  const { id = 'crown' } = useParams()
  const navigate = useNavigate()
  const gift = gifts.find((g) => g.id === id)
  const [name, setName] = useState(gift?.name ?? '')
  const [price, setPrice] = useState(gift?.price ?? '')
  const [status, setStatus] = useState<'Active' | 'Inactive'>(gift?.status ?? 'Active')

  return (
    <Page title="Edit Gift" breadcrumb="Pricing & Economics / Gift Catalog">
      <Card>
        <div className="flex flex-col gap-5 p-6">
          <div className="flex items-end gap-5">
            <div className="flex flex-col gap-1.5">
              <Label>Icon</Label>
              <div className="grid size-16 place-items-center rounded-[var(--radius-control)] border border-dashed border-line bg-fill text-[10px] text-faint">
                Icon
              </div>
            </div>
            <div className="w-[240px]">
              <Field label="Gift Name">
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
            </div>
          </div>

          <div className="w-[240px]">
            <Field label="Price (Beans)">
              <Input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" />
            </Field>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Status</Label>
            <div className="flex gap-5 text-[12px]">
              {(['Active', 'Inactive'] as const).map((s) => (
                <label key={s} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="gift-status"
                    className="accent-primary"
                    checked={status === s}
                    onChange={() => setStatus(s)}
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2.5">
            <Button size="sm" variant="outline" onClick={() => navigate('/pricing/gift-catalog')}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => navigate('/pricing/gift-catalog')}>
              Save
            </Button>
          </div>
        </div>
      </Card>
    </Page>
  )
}

/* ---------- fallback ---------- */

function NotFoundConfig() {
  return (
    <Page title="Not found" breadcrumb="Pricing & Economics">
      <ResultCard
        title="Configuration not found"
        body="This configuration page does not exist."
        actions={[{ label: 'Back to Pricing', to: '/pricing' }]}
      />
    </Page>
  )
}

export type { ConfirmSpec }

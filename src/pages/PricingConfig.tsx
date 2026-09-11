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
  LoadingState,
  ErrorState,
} from '../components/ui'
import { ConfirmDialog, type ConfirmSpec } from '../components/ConfirmDialog'
import { ResultCard } from '../components/ResultCard'
import {
  listCommissionConfig,
  createCommissionConfig,
  getBeansRateConfig,
  createBeansRateConfig,
  getWithdrawalPolicyConfig,
  createWithdrawalPolicyConfig,
  getWithdrawalSlabsConfig,
  replaceWithdrawalSlabsConfig,
  listGiftsAdmin,
  createGift,
  updateGift,
  ApiError,
  type WithdrawalPolicyInput,
} from '../lib/api'
import { useAsync } from '../lib/useAsync'
import { latestBatch, latestByGroup, latestConfig } from '../lib/configHistory'
import { formatBasisPoints, formatDate, formatPaise } from '../lib/format'
import { pick, unwrapList } from '../lib/pick'

const CHANGE_CONTEXT = 'Effective from now. Completed transactions and past payouts are not changed.'

/* ---------- Commission Configuration ---------- */

export function CommissionConfig() {
  const navigate = useNavigate()
  const { data, loading, error, reload } = useAsync(() => listCommissionConfig(), [])
  const [global, setGlobal] = useState('')
  const [overrideHostId, setOverrideHostId] = useState('')
  const [overridePct, setOverridePct] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  if (loading) return <Page title="Commission Configuration" breadcrumb="Pricing & Economics"><LoadingState /></Page>
  if (error) return <Page title="Commission Configuration" breadcrumb="Pricing & Economics"><ErrorState message={error} onRetry={reload} /></Page>

  const configs = unwrapList<Record<string, unknown>>(data, 'configs')
  const currentGlobalBp = pick(latestByGroup(configs, (c) => pick(c, 'hostId', '') || 'global').get('global'), 'basisPoints', 0)
  const currentGlobalPct = formatBasisPoints(currentGlobalBp)
  const globalValue = global || currentGlobalPct

  return (
    <Page title="Commission Configuration" breadcrumb="Pricing & Economics">
      <Card>
        <CardHeader>Commission</CardHeader>
        <div className="flex max-w-[520px] flex-col gap-4 p-5">
          <Field label="Global Commission %">
            <Input
              value={global}
              onChange={(e) => setGlobal(e.target.value)}
              placeholder={currentGlobalPct}
              inputMode="numeric"
            />
          </Field>
          <Field label="Host ID (for override, optional)">
            <Input value={overrideHostId} onChange={(e) => setOverrideHostId(e.target.value)} placeholder="Host UUID" />
          </Field>
          <Field label="Host Override %">
            <Input value={overridePct} onChange={(e) => setOverridePct(e.target.value)} inputMode="numeric" />
          </Field>
          <div>
            <Button size="sm" onClick={() => setConfirm(true)}>
              Save
            </Button>
          </div>
          {saveError && <p className="text-[11px] text-danger">{saveError}</p>}
          <Note>New configuration applies from the moment it is saved.</Note>
        </div>
      </Card>

      <ConfirmDialog
        open={confirm}
        spec={{
          title: 'Confirm commission update',
          compare: [
            { label: 'Previous', value: `${currentGlobalPct}%` },
            { label: 'New', value: `${globalValue || '0'}%` },
          ],
          context: CHANGE_CONTEXT,
          confirmLabel: 'Confirm Action',
        }}
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          setConfirm(false)
          setSaving(true)
          setSaveError(null)
          try {
            if (global) await createCommissionConfig(Math.round(Number(global) * 100))
            if (overrideHostId && overridePct) {
              await createCommissionConfig(Math.round(Number(overridePct) * 100), overrideHostId)
            }
            navigate('/pricing/commission/success')
          } catch (err) {
            setSaveError(err instanceof ApiError ? err.message : 'Something went wrong.')
          } finally {
            setSaving(false)
          }
        }}
      />
      {saving && <LoadingState label="Saving…" />}
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

/* ---------- Beans rate (paise per bean) ---------- */

export function BeansEarnRate() {
  const navigate = useNavigate()
  const { data, loading, error, reload } = useAsync(() => getBeansRateConfig(), [])
  const [paise, setPaise] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  if (loading) return <Page title="Beans Earn-rate" breadcrumb="Pricing & Economics"><LoadingState /></Page>
  if (error) return <Page title="Beans Earn-rate" breadcrumb="Pricing & Economics"><ErrorState message={error} onRetry={reload} /></Page>

  const current = latestConfig(unwrapList<Record<string, unknown>>(data, 'configs'))
  const currentPaise = pick(current, 'paisePerBean', 0)
  const newPaise = paise ? Number(paise) : currentPaise

  return (
    <Page title="Beans Earn-rate" breadcrumb="Pricing & Economics">
      <Card>
        <CardHeader>Earn-rate</CardHeader>
        <div className="flex max-w-[520px] flex-col gap-4 p-5">
          <div className="flex flex-col gap-1.5">
            <Label>Current configuration</Label>
            <div className="flex h-10 items-center gap-2 rounded-[var(--radius-control)] bg-fill px-3 text-[12px] text-amber">
              1 Bean = ₹
              <input
                value={paise ? (Number(paise) / 100).toString() : (currentPaise / 100).toString()}
                onChange={(e) => setPaise(String(Math.round(Number(e.target.value || '0') * 100)))}
                className="w-16 bg-transparent text-center outline-none"
                inputMode="decimal"
              />
            </div>
          </div>
          <div>
            <Button size="sm" onClick={() => setConfirm(true)}>
              Save
            </Button>
          </div>
          {saveError && <p className="text-[11px] text-danger">{saveError}</p>}
          <Note>Effective from now. Completed transactions are not recalculated.</Note>
        </div>
      </Card>

      <ConfirmDialog
        open={confirm}
        spec={{
          title: 'Confirm beans-rate update',
          compare: [
            { label: 'Previous', value: `1 bean = ₹ ${formatPaise(currentPaise)}` },
            { label: 'New', value: `1 bean = ₹ ${formatPaise(newPaise)}` },
          ],
          context: 'Effective from now. Completed transactions are not recalculated.',
          confirmLabel: 'Confirm Action',
        }}
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          setConfirm(false)
          setSaving(true)
          setSaveError(null)
          try {
            await createBeansRateConfig(newPaise)
            navigate('/pricing/beans-earn-rate/success')
          } catch (err) {
            setSaveError(err instanceof ApiError ? err.message : 'Something went wrong.')
          } finally {
            setSaving(false)
          }
        }}
      />
      {saving && <LoadingState label="Saving…" />}
    </Page>
  )
}

/* ---------- Withdrawal policy fields (min withdrawal / auto-approval threshold) ---------- */

type NumConfig = {
  title: string
  cardTitle: string
  currentLabel: string
  newLabel: string
  field: keyof WithdrawalPolicyInput
  note?: string
}

const NUM_CONFIG: Record<string, NumConfig> = {
  'minimum-withdrawal': {
    title: 'Minimum Withdrawal Amount',
    cardTitle: 'Minimum Withdrawal',
    currentLabel: 'Current minimum',
    newLabel: 'New minimum (₹)',
    field: 'minAmountPaise',
  },
  'auto-approval': {
    title: 'Auto-Approval Threshold',
    cardTitle: 'Auto-approval',
    currentLabel: 'Current threshold',
    newLabel: 'New threshold (₹)',
    field: 'autoApproveThresholdPaise',
    note: 'Requests at or below the threshold are auto-approved. Requests above it enter the manual Withdrawals queue.',
  },
}

export function NumericConfig({ configKey }: { configKey: string }) {
  const navigate = useNavigate()
  const cfg = NUM_CONFIG[configKey]
  const { data, loading, error, reload } = useAsync(() => getWithdrawalPolicyConfig(), [])
  const [value, setValue] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  if (!cfg) return <NotFoundConfig />
  if (loading) return <Page title={cfg.title} breadcrumb="Pricing & Economics"><LoadingState /></Page>
  if (error) return <Page title={cfg.title} breadcrumb="Pricing & Economics"><ErrorState message={error} onRetry={reload} /></Page>

  const current = latestConfig(unwrapList<Record<string, unknown>>(data, 'configs')) ?? {}
  const currentPaise = pick(current, cfg.field, 0)
  const newPaise = value ? Math.round(Number(value) * 100) : currentPaise

  return (
    <Page title={cfg.title} breadcrumb="Pricing & Economics">
      <Card>
        <CardHeader>{cfg.cardTitle}</CardHeader>
        <div className="flex flex-col gap-4 p-5">
          <div className="max-w-[520px]">
            <ReadonlyField label={cfg.currentLabel} value={`₹ ${formatPaise(currentPaise)}`} />
          </div>
          <div className="max-w-[520px]">
            <Field label={cfg.newLabel}>
              <Input value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" />
            </Field>
          </div>
          {cfg.note && <div className="max-w-[520px]"><Note>{cfg.note}</Note></div>}
          <div>
            <Button size="sm" onClick={() => setConfirm(true)}>
              Save
            </Button>
          </div>
          {saveError && <p className="text-[11px] text-danger">{saveError}</p>}
        </div>
      </Card>

      <ConfirmDialog
        open={confirm}
        spec={{
          title: 'Confirm policy update',
          compare: [
            { label: 'Previous', value: `₹ ${formatPaise(currentPaise)}` },
            { label: 'New', value: `₹ ${formatPaise(newPaise)}` },
          ],
          context: CHANGE_CONTEXT,
          confirmLabel: 'Confirm Action',
        }}
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          setConfirm(false)
          setSaving(true)
          setSaveError(null)
          try {
            const policy: WithdrawalPolicyInput = {
              minAmountPaise: pick(current, 'minAmountPaise', 0),
              maxRequestsPerWindow: pick(current, 'maxRequestsPerWindow', 1),
              windowDays: pick(current, 'windowDays', 7),
              autoApproveThresholdPaise: pick(current, 'autoApproveThresholdPaise', 0),
              processingFeePaise: pick(current, 'processingFeePaise', 0),
              tdsBasisPoints: pick(current, 'tdsBasisPoints', 0),
              [cfg.field]: newPaise,
            }
            await createWithdrawalPolicyConfig(policy)
            navigate('/pricing/config-updated')
          } catch (err) {
            setSaveError(err instanceof ApiError ? err.message : 'Something went wrong.')
          } finally {
            setSaving(false)
          }
        }}
      />
      {saving && <LoadingState label="Saving…" />}
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
  const { data, loading, error, reload } = useAsync(() => listCommissionConfig(), [])
  const [hostId, setHostId] = useState('')
  const [pct, setPct] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  if (loading) return <Page title="Host Commission Override" breadcrumb="Pricing & Economics"><LoadingState /></Page>
  if (error) return <Page title="Host Commission Override" breadcrumb="Pricing & Economics"><ErrorState message={error} onRetry={reload} /></Page>

  const configs = unwrapList<Record<string, unknown>>(data, 'configs')
  const byGroup = latestByGroup(configs, (c) => pick(c, 'hostId', '') || 'global')
  const globalBp = pick(byGroup.get('global'), 'basisPoints', 0)
  const overrides = [...byGroup.entries()].filter(([k]) => k !== 'global')

  async function addOverride() {
    if (!hostId || !pct) return
    setAdding(true)
    setAddError(null)
    try {
      await createCommissionConfig(Math.round(Number(pct) * 100), hostId)
      setHostId('')
      setPct('')
      reload()
    } catch (err) {
      setAddError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setAdding(false)
    }
  }

  return (
    <Page title="Host Commission Override" breadcrumb="Pricing & Economics">
      <div className="flex flex-col gap-4">
        <Table columns={['Host', 'Global %', 'Override %', 'Effective From']}>
          {overrides.map(([host, cfg]) => (
            <Row key={host}>
              <Cell>{host}</Cell>
              <Cell className="text-muted">{formatBasisPoints(globalBp)}</Cell>
              <Cell className="text-muted">{formatBasisPoints(pick(cfg, 'basisPoints', 0))}</Cell>
              <Cell className="text-muted">{formatDate(pick(cfg, 'effectiveFrom', null))}</Cell>
            </Row>
          ))}
          {overrides.length === 0 && (
            <Row>
              <Cell className="text-muted">No overrides configured.</Cell>
              <Cell />
              <Cell />
              <Cell />
            </Row>
          )}
        </Table>

        <Card className="flex flex-wrap items-end gap-3 p-4">
          <Field label="Host ID">
            <Input value={hostId} onChange={(e) => setHostId(e.target.value)} placeholder="Host UUID" />
          </Field>
          <Field label="Override %">
            <Input value={pct} onChange={(e) => setPct(e.target.value)} inputMode="numeric" />
          </Field>
          <Button size="sm" variant="outline" disabled={adding || !hostId || !pct} onClick={addOverride}>
            {adding ? 'Adding…' : 'Add override'}
          </Button>
          {addError && <p className="w-full text-[11px] text-danger">{addError}</p>}
        </Card>
      </div>
    </Page>
  )
}

/* ---------- Withdrawal Slabs ---------- */

export function WithdrawalSlabs() {
  const { data, loading, error, reload } = useAsync(() => getWithdrawalSlabsConfig(), [])
  const [minBeans, setMinBeans] = useState('')
  const [maxBeans, setMaxBeans] = useState('')
  const [paisePerBean, setPaisePerBean] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  if (loading) return <Page title="Withdrawal Slabs" breadcrumb="Pricing & Economics"><LoadingState /></Page>
  if (error) return <Page title="Withdrawal Slabs" breadcrumb="Pricing & Economics"><ErrorState message={error} onRetry={reload} /></Page>

  const slabs = latestBatch(unwrapList<Record<string, unknown>>(data, 'configs')).sort(
    (a, b) => pick(a, 'minBeans', 0) - pick(b, 'minBeans', 0),
  )

  async function addSlab() {
    if (!minBeans || !paisePerBean) return
    setSaving(true)
    setSaveError(null)
    try {
      const next = [
        ...slabs.map((s) => ({
          minBeans: pick(s, 'minBeans', 0),
          maxBeans: pick<number | null>(s, 'maxBeans', null),
          paisePerBean: pick(s, 'paisePerBean', 0),
        })),
        { minBeans: Number(minBeans), maxBeans: maxBeans ? Number(maxBeans) : null, paisePerBean: Number(paisePerBean) },
      ]
      await replaceWithdrawalSlabsConfig(next)
      setMinBeans('')
      setMaxBeans('')
      setPaisePerBean('')
      reload()
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Page title="Withdrawal Slabs" breadcrumb="Pricing & Economics">
      <div className="flex flex-col gap-4">
        <Table columns={['Slab', 'Beans Range', 'Value']}>
          {slabs.map((s, i) => (
            <Row key={i}>
              <Cell>Slab {String(i + 1).padStart(2, '0')}</Cell>
              <Cell className="text-muted">
                {pick(s, 'minBeans', 0)} – {pick<number | null>(s, 'maxBeans', null) ?? '∞'}
              </Cell>
              <Cell className="text-muted">₹ {formatPaise(pick(s, 'paisePerBean', 0))} /Bean</Cell>
            </Row>
          ))}
          {slabs.length === 0 && (
            <Row>
              <Cell className="text-muted">No slabs configured.</Cell>
              <Cell />
              <Cell />
            </Row>
          )}
        </Table>

        <Card className="flex flex-wrap items-end gap-3 p-4">
          <Field label="Min Beans">
            <Input value={minBeans} onChange={(e) => setMinBeans(e.target.value)} inputMode="numeric" />
          </Field>
          <Field label="Max Beans (blank = unlimited)">
            <Input value={maxBeans} onChange={(e) => setMaxBeans(e.target.value)} inputMode="numeric" />
          </Field>
          <Field label="Paise / Bean">
            <Input value={paisePerBean} onChange={(e) => setPaisePerBean(e.target.value)} inputMode="numeric" />
          </Field>
          <Button size="sm" variant="outline" disabled={saving || !minBeans || !paisePerBean} onClick={addSlab}>
            {saving ? 'Saving…' : 'Add Slab'}
          </Button>
          {saveError && <p className="w-full text-[11px] text-danger">{saveError}</p>}
        </Card>
      </div>
    </Page>
  )
}

/* ---------- Gift Catalog ---------- */

export function GiftCatalog() {
  const navigate = useNavigate()
  const { data, loading, error, reload } = useAsync(() => listGiftsAdmin(), [])
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  if (loading) return <Page title="Gift Catalog" breadcrumb="Pricing & Economics"><LoadingState /></Page>
  if (error) return <Page title="Gift Catalog" breadcrumb="Pricing & Economics"><ErrorState message={error} onRetry={reload} /></Page>

  const gifts = unwrapList<Record<string, unknown>>(data, 'gifts')

  async function addGift() {
    if (!name || !price) return
    setCreating(true)
    setCreateError(null)
    try {
      await createGift(name, Math.round(Number(price) * 100))
      setName('')
      setPrice('')
      reload()
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Page title="Gift Catalog" breadcrumb="Pricing & Economics">
      <div className="flex flex-col gap-4">
        <Table columns={['Icon', 'Gift', 'Price (₹)', 'Status', '']}>
          {gifts.map((g) => {
            const id = pick(g, 'id', '')
            return (
              <Row key={id}>
                <Cell>
                  <span className="inline-block size-6 rounded bg-primary-soft" />
                </Cell>
                <Cell>{pick(g, 'name', '—')}</Cell>
                <Cell className="text-muted">{formatPaise(pick(g, 'pricePaise', 0))}</Cell>
                <Cell>
                  <StatusText label={pick(g, 'active', true) ? 'Active' : 'Inactive'} />
                </Cell>
                <Cell className="text-right">
                  <button
                    onClick={() => navigate(`/pricing/gift-catalog/${id}/edit`)}
                    className="text-[11px] text-ink underline underline-offset-2 hover:text-primary"
                  >
                    EDIT
                  </button>
                </Cell>
              </Row>
            )
          })}
          {gifts.length === 0 && (
            <Row>
              <Cell className="text-muted">No gifts yet.</Cell>
              <Cell /><Cell /><Cell /><Cell />
            </Row>
          )}
        </Table>

        <Card className="flex flex-wrap items-end gap-3 p-4">
          <Field label="Gift Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Price (₹)">
            <Input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" />
          </Field>
          <Button size="sm" variant="outline" disabled={creating || !name || !price} onClick={addGift}>
            {creating ? 'Adding…' : 'Add Gifts'}
          </Button>
          {createError && <p className="w-full text-[11px] text-danger">{createError}</p>}
        </Card>
      </div>
    </Page>
  )
}

export function EditGift() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data, loading, error, reload } = useAsync(() => listGiftsAdmin(), [])
  const gift = unwrapList<Record<string, unknown>>(data, 'gifts').find((g) => pick(g, 'id', '') === id)

  const [name, setName] = useState<string | null>(null)
  const [price, setPrice] = useState<string | null>(null)
  const [active, setActive] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  if (loading) return <Page title="Edit Gift" breadcrumb="Pricing & Economics / Gift Catalog"><LoadingState /></Page>
  if (error) return <Page title="Edit Gift" breadcrumb="Pricing & Economics / Gift Catalog"><ErrorState message={error} onRetry={reload} /></Page>
  if (!gift) return <NotFoundConfig />

  const nameValue = name ?? pick(gift, 'name', '')
  const priceValue = price ?? formatPaise(pick(gift, 'pricePaise', 0))
  const activeValue = active ?? pick(gift, 'active', true)

  async function save() {
    setSaving(true)
    setSaveError(null)
    try {
      await updateGift(id, {
        name: nameValue,
        pricePaise: Math.round(Number(priceValue.replace(/,/g, '')) * 100),
        active: activeValue,
      })
      navigate('/pricing/gift-catalog')
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

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
                <Input value={nameValue} onChange={(e) => setName(e.target.value)} />
              </Field>
            </div>
          </div>

          <div className="w-[240px]">
            <Field label="Price (₹)">
              <Input value={priceValue} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" />
            </Field>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Status</Label>
            <div className="flex gap-5 text-[12px]">
              {([true, false] as const).map((s) => (
                <label key={String(s)} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="gift-status"
                    className="accent-primary"
                    checked={activeValue === s}
                    onChange={() => setActive(s)}
                  />
                  {s ? 'Active' : 'Inactive'}
                </label>
              ))}
            </div>
          </div>

          {saveError && <p className="text-[11px] text-danger">{saveError}</p>}

          <div className="flex gap-2.5">
            <Button size="sm" variant="outline" onClick={() => navigate('/pricing/gift-catalog')}>
              Cancel
            </Button>
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
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

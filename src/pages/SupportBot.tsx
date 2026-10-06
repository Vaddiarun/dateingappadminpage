import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Page } from '../components/Layout'
import { Card, CardHeader, Button, Tabs, Field, Input, Note, LoadingState, ErrorState } from '../components/ui'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { PreviewBanner, Pill, Select, useLoaded } from '../components/ops'
import {
  listHelpArticles, createHelpArticle, updateHelpArticle, deleteHelpArticle, getBotSettings, saveBotSettings,
  type HelpArticle,
} from '../lib/ops'
import { DRAFT_ARTICLES, hasPlaceholder, type Audience } from '../lib/helpArticles'
import { ApiError } from '../lib/api'
import { timeAgo } from '../lib/format'
import { pick, unwrapList } from '../lib/pick'

const AUDIENCES: { value: Audience; label: string }[] = [
  { value: 'host', label: 'Host app' },
  { value: 'user', label: 'User app' },
  { value: 'all', label: 'Both apps' },
]
const audienceLabel = (a: string) => AUDIENCES.find((x) => x.value === a)?.label ?? a

function Switch({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${on ? 'bg-primary' : 'bg-line'}`}
    >
      <span className={`block size-4 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-4' : ''}`} />
    </button>
  )
}

type Editing = { id?: string; title: string; content: string; audience: Audience; active: boolean }

export function SupportBot() {
  const [tab, setTab] = useState('articles')
  return (
    <Page
      title="Support Bot"
      breadcrumb="Support"
      actions={<Link to="/support" className="text-[12px] text-primary underline underline-offset-2">Open tickets</Link>}
    >
      <div className="flex flex-col gap-4">
        <Tabs tabs={[{ key: 'articles', label: 'Help articles' }, { key: 'settings', label: 'Bot settings' }]} active={tab} onChange={setTab} />
        {tab === 'articles' ? <Articles /> : <BotSettingsPanel />}
      </div>
    </Page>
  )
}

function Articles() {
  const { data, preview, loading, error, reload } = useLoaded(() => listHelpArticles(), [])
  const [editing, setEditing] = useState<Editing | null>(null)
  const [deleting, setDeleting] = useState<{ id: string; title: string } | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const articles = unwrapList<Record<string, unknown>>(data, 'articles', 'items')
  const titles = new Set(articles.map((a) => pick<string>(a, 'title', '').trim().toLowerCase()))
  const drafts = DRAFT_ARTICLES.filter((d) => !titles.has(d.title.toLowerCase()))

  const run = async (fn: () => Promise<unknown>, okText: string) => {
    setBusy(true)
    setMsg(null)
    try {
      await fn()
      setMsg({ ok: true, text: okText })
      reload()
      return true
    } catch (err) {
      setMsg({ ok: false, text: err instanceof ApiError ? err.message : 'Something went wrong.' })
      return false
    } finally {
      setBusy(false)
    }
  }

  const save = async () => {
    if (!editing) return
    const body = { title: editing.title.trim(), content: editing.content.trim(), audience: editing.audience, active: editing.active }
    const ok = await run(
      () => (editing.id ? updateHelpArticle(editing.id, body) : createHelpArticle(body as HelpArticle)),
      editing.id ? 'Article saved. The bot uses it from the next reply.' : 'Article added. The bot uses it from the next reply.',
    )
    if (ok) setEditing(null)
  }

  const editorProblem = editing
    ? !editing.title.trim() ? 'Add a title.'
      : editing.content.trim().length < 40 ? 'Write at least a few sentences.'
      : hasPlaceholder(editing.content) || hasPlaceholder(editing.title) ? 'Replace every [fill in …] with the real fact first — the bot would repeat it word for word.'
      : null
    : null

  return (
    <>
      {preview && <PreviewBanner what="help articles" />}
      <Note>
        The bot answers only from active articles for that app, and hands anything else to a person. Keep each article to one topic, written the way you'd explain it to someone. Changes apply on the bot's next reply — no app update needed.
      </Note>
      {msg && <p className={`text-[12px] ${msg.ok ? 'text-ok' : 'text-danger'}`}>{msg.text}</p>}

      <Card>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <span className="text-[11px] font-semibold tracking-[0.14em] text-ink uppercase">Live articles · {articles.length}</span>
          <Button size="sm" variant="outline" disabled={preview} onClick={() => setEditing({ title: '', content: '', audience: 'all', active: true })}>
            New article
          </Button>
        </div>
        <div className="divide-y divide-line">
          {articles.length === 0 && <p className="px-5 py-6 text-[12px] text-muted">No articles yet — start with the ready-made drafts below.</p>}
          {articles.map((a) => {
            const id = pick<string>(a, 'id', '')
            const active = pick<boolean>(a, 'active', true)
            return (
              <div key={id} className="flex items-center gap-3 px-5 py-3">
                <Switch on={active} disabled={preview || busy} onChange={(v) => run(() => updateHelpArticle(id, { active: v }), v ? 'Article turned on.' : 'Article turned off.')} />
                <div className="min-w-0 flex-1">
                  <div className={`truncate text-[13px] ${active ? 'text-ink' : 'text-faint'}`}>{pick<string>(a, 'title', 'Untitled')}</div>
                  <div className="text-[10px] text-muted">{audienceLabel(pick<string>(a, 'audience', 'all'))} · updated {timeAgo(pick(a, 'updatedAt', null))}</div>
                </div>
                <Button size="sm" variant="ghost" disabled={preview} onClick={() => setEditing({ id, title: pick<string>(a, 'title', ''), content: pick<string>(a, 'content', ''), audience: pick<Audience>(a, 'audience', 'all'), active })}>Edit</Button>
                <Button size="sm" variant="ghost" disabled={preview} className="!text-danger" onClick={() => setDeleting({ id, title: pick<string>(a, 'title', '') })}>Delete</Button>
              </div>
            )
          })}
        </div>
      </Card>

      {drafts.length > 0 && (
        <Card>
          <CardHeader>Ready-made drafts · {drafts.length}</CardHeader>
          <div className="divide-y divide-line">
            {drafts.map((d) => {
              const needs = hasPlaceholder(d.content)
              return (
                <div key={d.key} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] text-ink">{d.title}</div>
                    <div className="mt-0.5 flex gap-1.5">
                      <Pill label={audienceLabel(d.audience)} />
                      {needs ? <Pill label="Needs your facts" tone="warn" /> : <Pill label="Ready to add" tone="ok" />}
                    </div>
                  </div>
                  <Button size="sm" variant={needs ? 'outline' : 'primary'} disabled={preview} onClick={() => setEditing({ title: d.title, content: d.content, audience: d.audience, active: true })}>
                    {needs ? 'Review & fill in' : 'Review & add'}
                  </Button>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 p-6" onClick={() => setEditing(null)}>
          <div className="flex max-h-[90vh] w-[640px] max-w-full flex-col rounded-[12px] border border-line bg-surface shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-line px-6 py-4 text-[13px] font-semibold text-ink">{editing.id ? 'Edit article' : 'Add article'}</div>
            <div className="flex flex-col gap-3 overflow-y-auto px-6 py-4">
              <Field label="Title">
                <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} maxLength={120} />
              </Field>
              <div className="flex items-center gap-4">
                <Select label="Shown in" value={editing.audience} onChange={(v) => setEditing({ ...editing, audience: v as Audience })} options={AUDIENCES} />
                <label className="flex items-center gap-2 text-[11px] text-muted">
                  <Switch on={editing.active} onChange={(v) => setEditing({ ...editing, active: v })} /> Active
                </label>
              </div>
              <Field label="Article">
                <textarea
                  value={editing.content}
                  onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                  rows={14}
                  className="w-full resize-y rounded-[var(--radius-control)] bg-fill px-3 py-2.5 text-[12px] leading-5 text-ink outline-none ring-1 ring-transparent focus:ring-primary/40"
                />
              </Field>
              {hasPlaceholder(editing.content) && (
                <p className="text-[11px] text-warn">Replace each <b>[fill in …]</b> with the real fact (amounts, days, prices) before adding.</p>
              )}
            </div>
            <div className="flex items-center justify-end gap-2.5 border-t border-line px-6 py-3.5">
              {editorProblem && <span className="mr-auto text-[11px] text-muted">{editorProblem}</span>}
              <Button size="sm" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button size="sm" disabled={!!editorProblem || busy} onClick={save}>{busy ? 'Saving…' : editing.id ? 'Save' : 'Add to bot'}</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleting !== null}
        spec={deleting ? { title: 'Delete article?', subtitle: deleting.title, context: 'The bot stops using it from the next reply. You can turn an article off instead of deleting it.', confirmLabel: 'Delete' } : null}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          const d = deleting
          setDeleting(null)
          if (d) await run(() => deleteHelpArticle(d.id), 'Article deleted.')
        }}
      />
    </>
  )
}

const MODELS = [
  { value: 'claude-haiku-4-5', label: 'Haiku 4.5 — fast, about ₹0.3 per reply' },
  { value: 'claude-sonnet-5', label: 'Sonnet — better on hard questions, about ₹0.7 per reply' },
]

function BotSettingsPanel() {
  const { data, preview, loading, error, reload } = useLoaded(() => getBotSettings(), [])
  const [enabled, setEnabled] = useState(true)
  const [model, setModel] = useState('claude-haiku-4-5')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (!data) return
    setEnabled(pick<boolean>(data, 'enabled', true))
    setModel(pick<string>(data, 'model', 'claude-haiku-4-5'))
  }, [data])

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={reload} />
  const options = MODELS.some((m) => m.value === model) ? MODELS : [...MODELS, { value: model, label: model }]

  return (
    <>
      {preview && <PreviewBanner what="bot settings" />}
      <Card className="max-w-[640px]">
        <CardHeader>Bot settings</CardHeader>
        <div className="flex flex-col gap-4 p-5">
          <label className="flex items-center gap-3 text-[12px] text-ink">
            <Switch on={enabled} disabled={preview} onChange={setEnabled} />
            Bot answers first in support chats
          </label>
          <p className="-mt-2 text-[11px] text-muted">When off, every message goes straight to your team.</p>
          <Select label="Model" value={model} disabled={preview} onChange={setModel} options={options} />
          <Note>Start with Haiku. Switch to Sonnet only if good articles still get weak answers on harder questions.</Note>
          <div className="flex items-center gap-3">
            <Button
              disabled={preview || busy}
              onClick={async () => {
                setBusy(true)
                setMsg(null)
                try {
                  await saveBotSettings({ enabled, model })
                  setMsg({ ok: true, text: 'Saved.' })
                } catch (err) {
                  setMsg({ ok: false, text: err instanceof ApiError ? err.message : 'Something went wrong.' })
                } finally {
                  setBusy(false)
                }
              }}
            >
              Save settings
            </Button>
            {msg && <span className={`text-[11px] ${msg.ok ? 'text-ok' : 'text-danger'}`}>{msg.text}</span>}
          </div>
        </div>
      </Card>
    </>
  )
}

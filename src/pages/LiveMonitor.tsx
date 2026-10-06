import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Page } from '../components/Layout'
import { Card, Button, LoadingState, ErrorState } from '../components/ui'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { PreviewBanner, LiveDot, useLoaded } from '../components/ops'
import { listLiveBroadcasts, endBroadcast } from '../lib/ops'
import { ApiError } from '../lib/api'
import { formatDuration, formatNumber } from '../lib/format'
import { pick, unwrapList } from '../lib/pick'

export function LiveMonitor() {
  const { data, preview, loading, error, reload } = useLoaded(() => listLiveBroadcasts(), [])
  const [target, setTarget] = useState<{ id: string; title: string } | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000)
    const refresh = setInterval(reload, 15_000)
    return () => { clearInterval(tick); clearInterval(refresh) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const rows = unwrapList<Record<string, unknown>>(data, 'broadcasts')

  return (
    <Page title="Live Monitor" breadcrumb="Hosts broadcasting now">
      <div className="flex flex-col gap-4">
        {preview && <PreviewBanner what="live broadcasts" />}
        {actionError && <p className="text-[12px] text-danger">{actionError}</p>}
        {loading && !data ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : rows.length === 0 ? (
          <Card className="p-10 text-center text-[12px] text-muted">No one is live right now.</Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((b) => {
              const id = pick<string>(b, 'id', '')
              const started = new Date(pick<string>(b, 'startedAt', '')).getTime()
              return (
                <Card key={id} className="flex flex-col gap-3 p-5">
                  <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.12em] text-danger uppercase">
                    <LiveDot /> Live · {Number.isNaN(started) ? '—' : formatDuration((now - started) / 1000)}
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-ink">{pick<string>(b, 'title', 'Untitled')}</div>
                    <Link to={`/hosts/${encodeURIComponent(pick<string>(b, 'hostId', ''))}`} className="text-[11px] text-primary underline underline-offset-2">
                      {pick(b, 'hostName', pick<string>(b, 'hostId', '—'))}
                    </Link>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      ['Viewers', formatNumber(pick(b, 'viewerCount', 0))],
                      ['Gift beans', formatNumber(pick(b, 'giftBeans', 0))],
                      ['Comments', formatNumber(pick(b, 'commentsCount', 0))],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-[var(--radius-control)] bg-fill px-2 py-2">
                        <div className="text-[14px] font-medium text-ink">{value}</div>
                        <div className="text-[9px] tracking-[0.1em] text-muted uppercase">{label}</div>
                      </div>
                    ))}
                  </div>
                  <Button variant="danger" size="sm" disabled={preview} onClick={() => setTarget({ id, title: pick(b, 'title', id) })}>
                    End broadcast
                  </Button>
                </Card>
              )
            })}
          </div>
        )}
        <p className="text-[10px] text-muted">Refreshes every 15 seconds.</p>
      </div>

      <ConfirmDialog
        open={target !== null}
        spec={target ? { title: 'End this broadcast?', subtitle: target.title, context: 'Viewers are disconnected and the host is taken off air immediately.', note: 'This action will be recorded in the audit log.', reason: true, confirmLabel: 'End broadcast' } : null}
        onCancel={() => setTarget(null)}
        onConfirm={async (reason) => {
          const t = target
          setTarget(null)
          if (!t) return
          setActionError(null)
          try {
            await endBroadcast(t.id, reason || 'Ended by admin')
            reload()
          } catch (err) {
            setActionError(err instanceof ApiError ? err.message : 'Something went wrong.')
          }
        }}
      />
    </Page>
  )
}

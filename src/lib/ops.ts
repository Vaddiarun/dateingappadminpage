/**
 * Operations endpoints (support, calls, live, gifts, security, wallet, host stats, app settings).
 * These were specified alongside this module and may not exist on every backend yet, so each
 * read goes through `live()`: a 404/501 from the API falls back to clearly-labelled sample data
 * (`preview: true`) instead of an error screen. Pages show a "Preview" banner and disable every
 * action while `preview` is true, so nothing is ever written against sample data. Once the
 * backend ships an endpoint, the real data (and the actions) take over automatically.
 */
import { ApiError, apiFetch, qs } from './api'
import * as sample from './sample'

export type Loaded<T> = { data: T; preview: boolean }

export async function live<T>(call: () => Promise<T>, fallback: () => T): Promise<Loaded<T>> {
  try {
    return { data: await call(), preview: false }
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 501)) {
      return { data: fallback(), preview: true }
    }
    throw err
  }
}

type Q = Record<string, string | number | undefined>

/* ---------- Support tickets ---------- */

export const listTickets = (q: Q = {}) =>
  live(() => apiFetch<unknown>(`/admin/support/tickets${qs(q)}`), () => sample.tickets(q))
export const getTicket = (id: string) =>
  live(() => apiFetch<unknown>(`/admin/support/tickets/${encodeURIComponent(id)}`), () => sample.ticket(id))
export const replyToTicket = (id: string, content: string) =>
  apiFetch<unknown>(`/admin/support/tickets/${encodeURIComponent(id)}/messages`, { method: 'POST', body: JSON.stringify({ content }) })
export const updateTicket = (id: string, patch: { status?: string; priority?: string; assigneeId?: string | null }) =>
  apiFetch<unknown>(`/admin/support/tickets/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) })

/* ---------- Support bot: help articles + settings ----------
 * Paths assumed until the backend confirms them (see docs/BACKEND_OPS_API.md §15). */

export type HelpArticle = { id?: string; title: string; content: string; audience: 'host' | 'user' | 'all'; active: boolean; updatedAt?: string }
export const listHelpArticles = () =>
  live(() => apiFetch<unknown>('/admin/support/articles'), () => ({ articles: [] as HelpArticle[] }))
export const createHelpArticle = (a: HelpArticle) =>
  apiFetch<unknown>('/admin/support/articles', { method: 'POST', body: JSON.stringify(a) })
export const updateHelpArticle = (id: string, patch: Partial<HelpArticle>) =>
  apiFetch<unknown>(`/admin/support/articles/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) })
export const deleteHelpArticle = (id: string) =>
  apiFetch<unknown>(`/admin/support/articles/${encodeURIComponent(id)}`, { method: 'DELETE' })

export type BotSettings = { enabled: boolean; model: string }
export const getBotSettings = () =>
  live(() => apiFetch<unknown>('/admin/support/bot-settings'), () => ({ enabled: true, model: 'claude-haiku-4-5' }))
export const saveBotSettings = (s: BotSettings) =>
  apiFetch<unknown>('/admin/support/bot-settings', { method: 'PATCH', body: JSON.stringify(s) })

/* ---------- Calls ---------- */

export const listLiveCalls = () => live(() => apiFetch<unknown>('/admin/calls/live'), sample.liveCalls)
export const listCalls = (q: Q = {}) =>
  live(() => apiFetch<unknown>(`/admin/calls${qs(q)}`), () => sample.calls(q))
export const getCall = (id: string) =>
  live(() => apiFetch<unknown>(`/admin/calls/${encodeURIComponent(id)}`), () => sample.call(id))
export const endCall = (id: string, reason: string) =>
  apiFetch<unknown>(`/admin/calls/${encodeURIComponent(id)}/end`, { method: 'POST', body: JSON.stringify({ reason }) })

/* ---------- Live broadcasts ---------- */

export const listLiveBroadcasts = () =>
  live(() => apiFetch<unknown>('/admin/live/broadcasts?status=live'), sample.broadcasts)
export const endBroadcast = (id: string, reason: string) =>
  apiFetch<unknown>(`/admin/live/broadcasts/${encodeURIComponent(id)}/end`, { method: 'POST', body: JSON.stringify({ reason }) })

/* ---------- Gifts ---------- */

export const listGiftTransactions = (q: Q = {}) =>
  live(() => apiFetch<unknown>(`/admin/gifts/transactions${qs(q)}`), () => sample.giftTransactions(q))
export const listGiftRequests = (q: Q = {}) =>
  live(() => apiFetch<unknown>(`/admin/gifts/requests${qs(q)}`), () => sample.giftRequests(q))

/* ---------- Security events ---------- */

export const listSecurityEvents = (q: Q = {}) =>
  live(() => apiFetch<unknown>(`/admin/security-events${qs(q)}`), () => sample.securityEvents(q))

/* ---------- User wallet ---------- */

export const getUserWallet = (userId: string) =>
  live(() => apiFetch<unknown>(`/admin/users/${encodeURIComponent(userId)}/wallet`), () => sample.wallet(userId))
export const adjustUserWallet = (userId: string, amountPaise: number, reason: string, reference?: string) =>
  apiFetch<unknown>(`/admin/users/${encodeURIComponent(userId)}/adjustments`, {
    method: 'POST',
    body: JSON.stringify({ amountPaise, reason, ...(reference ? { reference } : {}) }),
  })

/* ---------- Host performance ---------- */

export const getHostDailySummary = (hostId: string, from: string, to: string) =>
  live(() => apiFetch<unknown>(`/admin/hosts/${encodeURIComponent(hostId)}/stats/daily-summary${qs({ from, to })}`), () => sample.hostDaily(hostId, from, to))
export const getHostStatsSummary = (hostId: string, from: string, to: string) =>
  live(() => apiFetch<unknown>(`/admin/hosts/${encodeURIComponent(hostId)}/stats/summary${qs({ from, to })}`), () => sample.hostSummary(hostId))

/* ---------- Moderation: reported conversation ---------- */

export const getReportConversation = (reportId: string) =>
  live(() => apiFetch<unknown>(`/admin/moderation/${encodeURIComponent(reportId)}/conversation`), () => sample.conversation(reportId))

/* ---------- Dashboard insights ---------- */

export const getDashboardInsights = (from: string, to: string) =>
  live(() => apiFetch<unknown>(`/admin/dashboard/insights${qs({ from, to })}`), () => sample.insights(from, to))

/* ---------- App settings ---------- */

export type AppSettings = {
  dailyGoalSeconds: number
  callQuality: { goodFromSeconds: number; excellentFromSeconds: number }
  messagePrice: { minPaise: number; maxPaise: number }
  liveCommentMaxLength: number
}
export const getAppSettings = () =>
  live(() => apiFetch<unknown>('/admin/config/app-settings'), sample.appSettings)
export const saveAppSettings = (s: AppSettings) =>
  apiFetch<unknown>('/admin/config/app-settings', { method: 'POST', body: JSON.stringify(s) })

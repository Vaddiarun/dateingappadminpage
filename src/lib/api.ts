import { API_BASE_URL } from './env'

const TOKEN_KEY = 'admin_access_token'
const REFRESH_KEY = 'admin_refresh_token'
const ADMIN_KEY = 'admin_user'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function setSession(token: string, admin: unknown, refreshToken?: string) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin))
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(ADMIN_KEY)
}

export function getStoredAdmin(): unknown | null {
  const raw = localStorage.getItem(ADMIN_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/** Decode a JWT's payload without verifying it — just to read `exp` for refresh scheduling. */
export function decodeJwtExpMs(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const exp = JSON.parse(json).exp
    return typeof exp === 'number' ? exp * 1000 : null
  } catch {
    return null
  }
}

let unauthorizedHandler: (() => void) | null = null
/** Called (once, from AuthProvider) so a hard session failure can also clear React state, not just localStorage. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler
}

let refreshPromise: Promise<string | null> | null = null

/** POST /admin/auth/token/refresh — confirmed live. The backend namespaces every endpoint by app surface (/user/*, /host/*, /admin/*), so this sits under /admin like the rest of this file, not the old unprefixed /auth/token/refresh. Rotates the refresh token too. */
export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return null
    try {
      const res = await fetch(`${API_BASE_URL}/admin/auth/token/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      if (!res.ok) return null
      const body = (await res.json()) as { accessToken?: string; refreshToken?: string }
      if (!body.accessToken) return null
      setSession(body.accessToken, getStoredAdmin(), body.refreshToken)
      return body.accessToken
    } catch {
      return null
    }
  })()
  const result = await refreshPromise
  refreshPromise = null
  return result
}

async function apiFetch<T = unknown>(path: string, init: RequestInit = {}, isRetry = false): Promise<T> {
  const token = getToken()
  const headers = new Headers(init.headers)
  if (init.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })
  } catch {
    throw new ApiError(0, `Could not reach the API at ${API_BASE_URL}. Is the backend running?`)
  }

  if (res.status === 401 && !isRetry && path !== '/admin/auth/token/refresh') {
    const newToken = await refreshAccessToken()
    if (newToken) return apiFetch<T>(path, init, true)
    clearSession()
    unauthorizedHandler?.()
    throw new ApiError(401, 'Your session expired. Please sign in again.')
  }

  const text = await res.text()
  const body = text ? safeJsonParse(text) : null

  if (!res.ok) {
    const message =
      (body && typeof body === 'object' && ((body as Record<string, unknown>).message || (body as Record<string, unknown>).error)) ||
      res.statusText ||
      `Request failed (${res.status})`
    throw new ApiError(res.status, String(message))
  }

  return body as T
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function qs(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  if (entries.length === 0) return ''
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')
}

/* ---------- Auth ---------- */

export function adminLogin(email: string, password: string) {
  return apiFetch<unknown>('/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

/* ---------- KYC ---------- */

export function listPendingKyc() {
  return apiFetch<unknown>('/admin/kyc/pending')
}

export function getKycSubmission(hostId: string) {
  return apiFetch<unknown>(`/admin/kyc/${encodeURIComponent(hostId)}`)
}

export function decideKyc(hostId: string, decision: 'approve' | 'reject', rejectionReason?: string) {
  return apiFetch<unknown>(`/admin/kyc/${encodeURIComponent(hostId)}/decision`, {
    method: 'POST',
    body: JSON.stringify({ decision, ...(rejectionReason ? { rejectionReason } : {}) }),
  })
}

/* ---------- Withdrawals ---------- */

export function listWithdrawals(status?: string) {
  return apiFetch<unknown>(`/admin/withdrawals${qs({ status })}`)
}

export function getWithdrawal(id: string) {
  return apiFetch<unknown>(`/admin/withdrawals/${encodeURIComponent(id)}`)
}

export function decideWithdrawal(id: string, decision: 'approve' | 'reject', rejectionReason?: string) {
  return apiFetch<unknown>(`/admin/withdrawals/${encodeURIComponent(id)}/decision`, {
    method: 'POST',
    body: JSON.stringify({ decision, ...(rejectionReason ? { rejectionReason } : {}) }),
  })
}

/* ---------- Pricing & Economics Config ---------- */

export function listCommissionConfig() {
  return apiFetch<unknown>('/admin/config/commission')
}

export function createCommissionConfig(basisPoints: number, hostId?: string) {
  return apiFetch<unknown>('/admin/config/commission', {
    method: 'POST',
    body: JSON.stringify({ basisPoints, ...(hostId ? { hostId } : {}) }),
  })
}

export function getBeansRateConfig() {
  return apiFetch<unknown>('/admin/config/beans-rate')
}

export function createBeansRateConfig(paisePerBean: number) {
  return apiFetch<unknown>('/admin/config/beans-rate', {
    method: 'POST',
    body: JSON.stringify({ paisePerBean }),
  })
}

export function getWithdrawalPolicyConfig() {
  return apiFetch<unknown>('/admin/config/withdrawal-policy')
}

export type WithdrawalPolicyInput = {
  minAmountPaise: number
  maxRequestsPerWindow: number
  windowDays: number
  autoApproveThresholdPaise: number
  processingFeePaise: number
  tdsBasisPoints: number
}

export function createWithdrawalPolicyConfig(policy: WithdrawalPolicyInput) {
  return apiFetch<unknown>('/admin/config/withdrawal-policy', {
    method: 'POST',
    body: JSON.stringify(policy),
  })
}

export function getWithdrawalSlabsConfig() {
  return apiFetch<unknown>('/admin/config/withdrawal-slabs')
}

export type WithdrawalSlabInput = { minBeans: number; maxBeans: number | null; paisePerBean: number }

export function replaceWithdrawalSlabsConfig(slabs: WithdrawalSlabInput[]) {
  return apiFetch<unknown>('/admin/config/withdrawal-slabs', {
    method: 'POST',
    body: JSON.stringify({ slabs }),
  })
}

export function listGiftsAdmin() {
  return apiFetch<unknown>('/admin/gifts')
}

export function createGift(name: string, pricePaise: number) {
  return apiFetch<unknown>('/admin/gifts', {
    method: 'POST',
    body: JSON.stringify({ name, pricePaise }),
  })
}

export function updateGift(id: string, patch: { name?: string; pricePaise?: number; active?: boolean }) {
  return apiFetch<unknown>(`/admin/gifts/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

/* ---------- Users & Hosts ---------- */

export function listUsers() {
  return apiFetch<unknown>('/admin/users')
}

export function getUser(id: string) {
  return apiFetch<unknown>(`/admin/users/${encodeURIComponent(id)}`)
}

export function listHosts() {
  return apiFetch<unknown>('/admin/hosts')
}

export function getHost(id: string) {
  return apiFetch<unknown>(`/admin/hosts/${encodeURIComponent(id)}`)
}

export function listHostGallery(hostId: string) {
  return apiFetch<unknown>(`/admin/hosts/${encodeURIComponent(hostId)}/gallery`)
}

export function deleteHostGalleryItem(hostId: string, itemId: string) {
  return apiFetch<unknown>(`/admin/hosts/${encodeURIComponent(hostId)}/gallery/${encodeURIComponent(itemId)}`, {
    method: 'DELETE',
  })
}

/**
 * The collection only documents this under /admin/users/:id/status; it's used
 * for both user and host accounts here since no separate host-status route
 * is defined. Repoint this at a dedicated host endpoint if the backend has one.
 */
export function setAccountStatus(id: string, status: 'suspended' | 'active' | 'banned', reason?: string) {
  return apiFetch<unknown>(`/admin/users/${encodeURIComponent(id)}/status`, {
    method: 'POST',
    body: JSON.stringify({ status, ...(reason ? { reason } : {}) }),
  })
}

/* ---------- Moderation ---------- */

export function listModerationQueue(status?: string) {
  return apiFetch<unknown>(`/admin/moderation${qs({ status })}`)
}

export function resolveModerationReport(
  reportId: string,
  action: 'resolved' | 'dismissed',
  opts?: { resolutionNote?: string; accountAction?: 'warn' | 'suspend' | 'ban' },
) {
  return apiFetch<unknown>(`/admin/moderation/${encodeURIComponent(reportId)}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ action, ...opts }),
  })
}

/* ---------- Broadcast Messages ---------- */

export function listBroadcastMessages() {
  return apiFetch<unknown>('/admin/broadcast-messages')
}

export function sendBroadcastMessage(title: string, message: string, recipients: 'all_users' | 'all_hosts' | 'all') {
  return apiFetch<unknown>('/admin/broadcast-messages', {
    method: 'POST',
    body: JSON.stringify({ title, message, recipients }),
  })
}

/* ---------- Adult Mode ---------- */

export function getAdultModeConfig() {
  return apiFetch<unknown>('/admin/config/adult-mode')
}

export function setAdultModeConfig(enabled: boolean) {
  return apiFetch<unknown>('/admin/config/adult-mode', {
    method: 'POST',
    body: JSON.stringify({ enabled }),
  })
}

/* ---------- Audit & Dashboard ---------- */

export function getAuditLog(opts?: { limit?: number; adminId?: string; from?: string; to?: string }) {
  return apiFetch<unknown>(`/admin/audit-log${qs({ limit: opts?.limit, adminId: opts?.adminId, from: opts?.from, to: opts?.to })}`)
}

export function getDashboard(opts?: { from?: string; to?: string }) {
  return apiFetch<unknown>(`/admin/dashboard${qs({ from: opts?.from, to: opts?.to })}`)
}

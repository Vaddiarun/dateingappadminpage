import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import {
  adminLogin,
  clearSession,
  decodeJwtExpMs,
  getStoredAdmin,
  getToken,
  refreshAccessToken,
  setSession,
  setUnauthorizedHandler,
} from './api'
import { pickAny } from './pick'

type AdminUser = { id: string; email: string }

type AuthContextValue = {
  token: string | null
  admin: AdminUser | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function toAdminUser(raw: unknown, fallbackEmail: string): AdminUser {
  return {
    id: pickAny(raw, ['id', '_id'], fallbackEmail),
    email: pickAny(raw, ['email'], fallbackEmail),
  }
}

// The access token is a 15-minute JWT (confirmed live) with a separate,
// longer-lived refresh token. Without this, every admin session would
// silently start failing 15 minutes after login.
const REFRESH_MARGIN_MS = 60_000

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getToken())
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    const stored = getStoredAdmin()
    return stored ? toAdminUser(stored, '') : null
  })
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function scheduleRefresh(accessToken: string) {
    if (refreshTimer.current) clearTimeout(refreshTimer.current)
    const expMs = decodeJwtExpMs(accessToken)
    if (!expMs) return
    const delay = Math.max(expMs - Date.now() - REFRESH_MARGIN_MS, 5_000)
    refreshTimer.current = setTimeout(async () => {
      const newToken = await refreshAccessToken()
      if (newToken) {
        setToken(newToken)
        scheduleRefresh(newToken)
      }
      // If refresh failed, the next real API call's 401 handling (apiFetch)
      // will clear the session via the unauthorized handler registered below.
    }, delay)
  }

  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
      setToken(null)
      setAdmin(null)
    })
    const current = getToken()
    if (current) scheduleRefresh(current)
    return () => {
      setUnauthorizedHandler(null)
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      admin,
      async login(email: string, password: string) {
        const res = await adminLogin(email, password)
        const accessToken = pickAny<string>(res, ['accessToken', 'token'], '')
        if (!accessToken) throw new Error('Login succeeded but no access token was returned.')
        const refreshToken = pickAny<string>(res, ['refreshToken'], '')
        const adminUser = toAdminUser(pickAny(res, ['user', 'admin'], null), email)
        setSession(accessToken, adminUser, refreshToken || undefined)
        setToken(accessToken)
        setAdmin(adminUser)
        scheduleRefresh(accessToken)
      },
      logout() {
        if (refreshTimer.current) clearTimeout(refreshTimer.current)
        clearSession()
        setToken(null)
        setAdmin(null)
      },
    }),
    [token, admin],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const location = useLocation()
  if (!token) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}

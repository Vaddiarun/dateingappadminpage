import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { adminLogin, clearSession, getStoredAdmin, getToken, setSession } from './api'
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getToken())
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    const stored = getStoredAdmin()
    return stored ? toAdminUser(stored, '') : null
  })

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      admin,
      async login(email: string, password: string) {
        const res = await adminLogin(email, password)
        const accessToken = pickAny<string>(res, ['accessToken', 'token'], '')
        if (!accessToken) throw new Error('Login succeeded but no access token was returned.')
        const adminUser = toAdminUser(pickAny(res, ['user', 'admin'], null), email)
        setSession(accessToken, adminUser)
        setToken(accessToken)
        setAdmin(adminUser)
      },
      logout() {
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

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui'
import { EyeIcon, EyeOffIcon, LogoMark } from '../components/Icon'

function FieldLabel({ children }: { children: string }) {
  return <span className="text-[13px] text-muted">{children}</span>
}

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    // Demo: any non-empty email + password signs in; empty shows the error state.
    if (!email || !password) {
      setError(true)
      return
    }
    navigate('/')
  }

  return (
    <div className="grid min-h-full place-items-center bg-[#f5f5f6] p-6">
      <form
        onSubmit={submit}
        className="w-[620px] max-w-full rounded-[var(--radius-card)] bg-surface px-[60px] py-12 shadow-sm"
      >
        <div className="flex items-center gap-2 text-muted">
          <LogoMark size={18} />
          <span className="text-[15px] tracking-[0.02em]">COMPANY · ADMIN</span>
        </div>

        <div className="mt-7 flex flex-col gap-1.5">
          <FieldLabel>Email address</FieldLabel>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 rounded-[var(--radius-control)] bg-fill px-3 text-[13px] text-ink outline-none ring-1 ring-transparent focus:ring-primary/40"
          />
        </div>

        <div className="mt-5 flex flex-col gap-1.5">
          <FieldLabel>Password</FieldLabel>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 w-full rounded-[var(--radius-control)] bg-fill px-3 pr-10 text-[13px] text-ink outline-none ring-1 ring-transparent focus:ring-primary/40"
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-faint hover:text-muted"
            >
              {showPw ? <EyeIcon size={15} /> : <EyeOffIcon size={15} />}
            </button>
          </div>
        </div>

        <div className="mt-2 text-right">
          <button type="button" className="text-[12px] text-faint hover:text-muted">
            forgot password?
          </button>
        </div>

        {error && (
          <p className="mt-3 text-[13px] text-danger">Something went wrong.</p>
        )}

        <Button type="submit" className="mt-4 w-full">
          Sign In
        </Button>
      </form>
    </div>
  )
}

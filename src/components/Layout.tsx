import type { ComponentType } from 'react'
import type { ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  DashboardIcon,
  UsersIcon,
  HostsIcon,
  KycIcon,
  WithdrawalsIcon,
  PricingIcon,
  ModerationIcon,
  AgeModeIcon,
  AuditIcon,
  BroadcastIcon,
  ChevronDownIcon,
  LogoMark,
} from './Icon'

type NavItem = { to: string; label: string; icon: ComponentType<{ size?: number }> }

const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon },
  { to: '/users', label: 'Users', icon: UsersIcon },
  { to: '/hosts', label: 'Hosts', icon: HostsIcon },
  { to: '/kyc', label: 'KYC', icon: KycIcon },
  { to: '/withdrawals', label: 'Withdrawals', icon: WithdrawalsIcon },
  { to: '/pricing', label: 'Pricing & Economics', icon: PricingIcon },
  { to: '/moderation', label: 'Moderation', icon: ModerationIcon },
  { to: '/age-mode', label: '18+ Mode', icon: AgeModeIcon },
  { to: '/audit-logs', label: 'Audit Logs', icon: AuditIcon },
  { to: '/broadcast', label: 'Broadcast Messaging', icon: BroadcastIcon },
]

function Sidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-surface">
      <div className="flex items-center gap-2 px-5 py-4">
        <LogoMark size={22} />
        <span className="text-[13px] font-semibold tracking-[0.14em] text-ink">
          COMPANY · ADMIN
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-2 overflow-y-auto py-2 pr-2.5">
        {NAV.map(({ to, label, icon: I }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `relative flex items-center gap-2.5 rounded-r-[var(--radius-control)] py-2.5 pr-3 pl-5 text-[13px] transition-colors ${isActive
                ? 'bg-primary-soft font-medium text-primary'
                : 'text-muted hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute top-1 bottom-1 left-0 w-[3px] rounded-full bg-primary" />
                )}
                <I size={25} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-line px-5 py-4 text-[9px] tracking-[0.13em] text-faint uppercase">
        Role · Super Admin
      </div>
    </aside>
  )
}

function UserPill() {
  return (
    <button className="inline-flex h-8 items-center gap-2 rounded-full bg-primary pr-2.5 pl-1 text-[11px] text-white">
      <span className="size-6 rounded-full bg-white/85" />
      admin@company
      <ChevronDownIcon size={13} />
    </button>
  )
}

export function Topbar({
  title,
  breadcrumb,
  actions,
}: {
  title: string
  breadcrumb?: string
  actions?: ReactNode
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-surface px-6">
      <div className="flex flex-col justify-center">
        {breadcrumb && (
          <span className="text-[9px] tracking-[0.13em] text-muted uppercase">
            {breadcrumb}
          </span>
        )}
        <h1 className="text-[17px] font-semibold text-ink">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <UserPill />
      </div>
    </header>
  )
}

export function Layout() {
  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  )
}

/** Page scaffold: renders the top bar + a padded scroll area. */
export function Page({
  title,
  breadcrumb,
  actions,
  children,
}: {
  title: string
  breadcrumb?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <>
      <Topbar title={title} breadcrumb={breadcrumb} actions={actions} />
      <main className="flex-1 overflow-y-auto bg-canvas p-6">{children}</main>
    </>
  )
}

import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function base({ size = 16, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...props,
  }
}

export function DashboardIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  )
}

export function UsersIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c.7-3 3-4.5 5.5-4.5S13.8 16 14.5 19" />
      <path d="M16 5.2a3 3 0 0 1 0 5.6" />
      <path d="M17.5 14.6c2 .6 3.6 2.1 4.2 4.4" />
    </svg>
  )
}

export function HostsIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6.5 18.5a6 6 0 0 1 11 0" />
    </svg>
  )
}

export function KycIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13l2 2 4-4" />
    </svg>
  )
}

export function WithdrawalsIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.4" />
      <path d="M5.5 9v6M18.5 9v6" />
    </svg>
  )
}

export function PricingIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 7h16M4 12h16M4 17h16" />
      <circle cx="9" cy="7" r="2" fill="var(--color-canvas)" />
      <circle cx="15" cy="12" r="2" fill="var(--color-canvas)" />
      <circle cx="8" cy="17" r="2" fill="var(--color-canvas)" />
    </svg>
  )
}

export function ModerationIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M5 3v18" />
      <path d="M5 4h11l-1.5 4L16 12H5" />
    </svg>
  )
}

export function AgeModeIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z" />
      <path d="M12 8v4.5" />
      <circle cx="12" cy="15.5" r="0.6" fill="currentColor" />
    </svg>
  )
}

export function SubAdminIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c.7-3 3-4.5 5.5-4.5 1 0 2 .2 2.8.7" />
      <circle cx="17.5" cy="16.5" r="2.5" />
      <path d="M17.5 12.7v1.3M17.5 19v1.3M21 16.5h-1.3M15.3 16.5H14M20 14l-.9.9M15.9 18.1l-.9.9M20 19l-.9-.9M15.9 14.9l-.9-.9" />
    </svg>
  )
}

export function LiveBroadcastIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="2" />
      <path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 15.5a5 5 0 0 0 0-7" />
      <path d="M6 6a9 9 0 0 0 0 12M18 18A9 9 0 0 0 18 6" />
    </svg>
  )
}

export function AuditIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M6 3h11v15a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3" />
      <path d="M17 21a3 3 0 0 0 3-3v-2h-3" />
      <path d="M4 18a3 3 0 0 1 3-3h0" />
      <path d="M8.5 8h6M8.5 11.5h6" />
    </svg>
  )
}

export function BroadcastIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 9v6h4l7 4V5L8 9H4Z" />
      <path d="M18 8.5a4 4 0 0 1 0 7" />
    </svg>
  )
}

export function SearchIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.6-3.6" />
    </svg>
  )
}

export function ChevronDownIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export function EyeIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function EyeOffIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a3 3 0 0 0 4.2 4.2" />
      <path d="M9.4 5.3A9.6 9.6 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.4 4.2M6.2 6.2A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 3.9-.8" />
    </svg>
  )
}

export function TrashIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    </svg>
  )
}

export function CheckIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="m5 13 4 4L19 7" />
    </svg>
  )
}

export function PlusIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function MinusIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M5 12h14" />
    </svg>
  )
}

export function RotateIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 4v5h-5" />
    </svg>
  )
}

export function PlayIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M8 5v14l11-7-11-7Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function LogoMark(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <rect x="9" y="9" width="6" height="6" rx="1.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

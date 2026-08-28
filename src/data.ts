/* Mock data mirroring the Figma screens. */

export const dashboardStats = {
  revenue: '18,42,300',
  activeUsers: '24,108',
  activeHosts: '1,246',
  totalCallMinutes: '412,880',
  commissionCollected: '3,68,460',
}

/** Relative bar heights (0–1) for the Revenue / Activity chart. */
export const revenueSeries = [
  0.42, 0.55, 0.38, 0.74, 0.5, 0.82, 0.6, 0.88, 0.46, 0.7, 0.78, 0.52,
]

export const topEarningHosts = [
  { host: 'Host_0192', earnings: '84,200', minutes: '6,120', status: 'Active' },
  { host: 'Host_0475', earnings: '71,050', minutes: '5,480', status: 'Active' },
  { host: 'Host_1130', earnings: '66,900', minutes: '5,010', status: 'Active' },
  { host: 'Host_0088', earnings: '58,340', minutes: '4,760', status: 'Active' },
]

export type User = {
  id: string
  email: string
  status: string
  lastActive: string
}

export const users: User[] = [
  { id: 'User_2481', email: 'user2481@mail', status: 'Active', lastActive: '12 Aug 2026' },
  { id: 'User_1180', email: 'user1180@mail', status: 'Active', lastActive: '11 Aug 2026' },
  { id: 'User_0934', email: 'user0934@mail', status: 'Suspended', lastActive: '09 Aug 2026' },
  { id: 'User_3320', email: 'user3320@mail', status: 'Active', lastActive: '08 Aug 2026' },
  { id: 'User_2765', email: 'user2765@mail', status: 'Banned', lastActive: '05 Aug 2026' },
  { id: 'User_1902', email: 'user1902@mail', status: 'Active', lastActive: '04 Aug 2026' },
]

export type Host = {
  id: string
  email: string
  kyc: string
  availability: string
  status: string
  lastActive: string
}

export const hosts: Host[] = [
  { id: 'Host_2481', email: 'host2481@mail', kyc: 'Approved', availability: 'Online', status: 'Active', lastActive: 'Today' },
  { id: 'Host_1180', email: 'host1180@mail', kyc: 'Approved', availability: 'In Call', status: 'Active', lastActive: '11 Aug 2026' },
  { id: 'Host_0934', email: 'host0934@mail', kyc: 'Pending', availability: 'In Call', status: 'Suspended', lastActive: 'Yesterday' },
  { id: 'Host_3320', email: 'host3320@mail', kyc: 'Approved', availability: 'Offline', status: 'Active', lastActive: '08 Aug 2026' },
  { id: 'Host_2765', email: 'host2765@mail', kyc: 'Rejected', availability: 'In Call', status: 'Banned', lastActive: '05 Aug 2026' },
  { id: 'Host_1902', email: 'host1902@mail', kyc: 'Approved', availability: 'Live', status: 'Active', lastActive: '04 Aug 2026' },
]

export type KycSubmission = {
  id: string
  email: string
  submitted: string
  documents: string
  attempts: string
  status: string
}

export const kycSubmissions: KycSubmission[] = [
  { id: 'Host_2481', email: 'host2481@mail', submitted: 'Today', documents: '4 files', attempts: '1st', status: 'Approved' },
  { id: 'Host_1180', email: 'host1180@mail', submitted: '11 Aug 2026', documents: '4 files', attempts: '4th', status: 'Approved' },
  { id: 'Host_0934', email: 'host0934@mail', submitted: 'Yesterday', documents: '3 files', attempts: '1st', status: 'Pending' },
  { id: 'Host_3320', email: 'host3320@mail', submitted: '08 Aug 2026', documents: '4 files', attempts: '1st', status: 'Approved' },
  { id: 'Host_2765', email: 'host2765@mail', submitted: '05 Aug 2026', documents: '4 files', attempts: '2nd', status: 'Reject' },
  { id: 'Host_1902', email: 'host1902@mail', submitted: '04 Aug 2026', documents: '4 files', attempts: '3rd', status: 'Approved' },
]

export type Withdrawal = {
  id: string
  email: string
  beans: string
  value: string
  requested: string
  status: string
}

export const withdrawals: Withdrawal[] = [
  { id: 'Host_2481', email: 'host2481@mail', beans: '1,20,000', value: '1,20,000', requested: '13 Aug  09:15 PM', status: 'Approved' },
  { id: 'Host_1180', email: 'host1180@mail', beans: '98,000', value: '98,000', requested: '13 Aug  09:15 PM', status: 'Approved' },
  { id: 'Host_0934', email: 'host0934@mail', beans: '1,60,000', value: '1,60,000', requested: '13 Aug  09:15 PM', status: 'Pending' },
]

export const moderationReports = [
  { id: 'Host_0088', type: 'Host', reason: 'Inappropriate Content', availability: 'Online', when: 'Today', status: 'Open' },
  { id: 'User_1180', type: 'Host', reason: 'Abusive language', availability: 'In Call', when: '11 Aug 2026', status: 'Open' },
  { id: 'Broadcast #2', type: 'Content', reason: 'False Information', availability: 'In Call', when: 'Yesterday', status: 'Open' },
  { id: 'User_3320', type: 'User', reason: 'Spam', availability: 'Offline', when: '08 Aug 2026', status: 'Actioned' },
]

export const auditLogs = [
  { who: 'Admin A', what: 'Suspended User — User_2481', when: '12 Aug 2026 12:45 PM' },
  { who: 'Admin b', what: 'Updated Pricing & Economics — Commission 30% → 28%', when: '11 Aug 2026 12:45 PM' },
  { who: 'Admin A', what: 'Changed 18+ Mode — ON → OFF', when: '09 Aug 2026 12:45 PM' },
  { who: 'Admin A', what: 'Approved KYC — Host_11', when: '08 Aug 2026 12:45 PM' },
  { who: 'Admin c', what: 'Banned Host — Host_154', when: '05 Aug 2026 12:45 PM' },
  { who: 'Admin c', what: 'Deleted Gallery Video — Host_0192', when: '05 Aug 2026 12:45 PM' },
]

export const broadcasts = [
  { message: 'User_2481', recipients: 'All Hosts', sentBy: 'Admin A', sent: '12 Aug 2026' },
  { message: 'User_1180', recipients: 'All Hosts', sentBy: 'Admin A', sent: '11 Aug 2026' },
  { message: 'User_0934', recipients: 'All Hosts', sentBy: 'Admin A', sent: '09 Aug 2026' },
]

export type PricingCard = {
  key: string
  title: string
  summary: string
  action: 'Open' | 'Suspend'
  to?: string
  accent?: boolean
}

export const pricingCards: PricingCard[] = [
  { key: 'commission', title: 'Commission Configuration', summary: 'Global 30%', action: 'Open', to: '/pricing/commission' },
  { key: 'override', title: 'Host Commission Override', summary: '12 hosts overridden', action: 'Open', to: '/pricing/host-override' },
  { key: 'beans', title: 'Beans Earn-rate', summary: '1 min = 40 beans', action: 'Open', to: '/pricing/beans-earn-rate', accent: true },
  { key: 'slabs', title: 'Withdrawal Slabs', summary: '3 slabs', action: 'Suspend', to: '/pricing/withdrawal-slabs' },
  { key: 'gifts', title: 'Gift Catalog', summary: '18 gifts · 15 active', action: 'Open', to: '/pricing/gift-catalog' },
  { key: 'min', title: 'Minimum Withdrawal Amount', summary: '₹ 1,000', action: 'Open', to: '/pricing/minimum-withdrawal' },
  { key: 'threshold', title: 'Auto-approval Threshold', summary: '₹ 50,000', action: 'Open', to: '/pricing/auto-approval' },
]

export const withdrawalDetail = {
  id: 'Host_0475',
  host: 'Host_0475',
  requested: '13 Aug 2026 · 09:12',
  beans: '1,250,000',
  payoutValue: '1,25,000',
  slab: 'Slab 03',
  aboveThreshold: 'Yes — manual review required',
  checks: [
    'KYC approved',
    'Payout details on file',
    'Above minimum withdrawal amount',
    'No open moderation reports',
  ],
}

export const moderationDetail = {
  entity: 'Host_0088',
  entityType: 'Host',
  reason: 'Inappropriate content',
  reportedBy: 'User_3320',
  reportedOn: '13 Aug 2026 · 09:40',
  context: 'Live broadcast',
  actions: ['Dismiss', 'Warn', 'Suspend', 'Ban'],
}

/* ---------- Account detail (Users / Hosts) ---------- */

export const accountActivity = [
  { type: 'Call', reference: 'Host_0192 · 12 min', when: 'Today 10:04' },
  { type: 'Gift', reference: 'Host_0475 · 250 beans', when: 'Today 09:22', accent: true },
  { type: 'Chat', reference: 'Host_1130', when: 'Yesterday' },
]

export const accountReports = [
  { reason: 'Abusive language', reportedBy: 'Host_0192', when: '10 Aug 2026' },
]

export const hostGallery = Array.from({ length: 10 }, (_, i) => ({
  id: `item_${i + 1}`,
  kind: i % 3 === 1 ? ('video' as const) : ('photo' as const),
  duration: '0:24',
}))

export const kycDocs = [
  { key: 'front', label: 'ID Document — Front', chip: 'Front ID' },
  { key: 'back', label: 'ID Document — Back', chip: 'Back ID' },
  { key: 'selfie', label: 'Selfie', chip: 'Selfie' },
  { key: 'address', label: 'Address Proof', chip: 'Address Proof' },
]

/* ---------- Pricing sub-pages ---------- */

export const hostCommissionOverrides = [
  { host: 'Host_0192', global: '30', override: '25', effectiveFrom: '01 Aug 2026' },
  { host: 'Host_0475', global: '30', override: '22', effectiveFrom: '28 Jul 2026' },
  { host: 'Host_0088', global: '30', override: '—', effectiveFrom: '—' },
]

export const withdrawalSlabs = [
  { slab: 'Slab 01', range: '0 – 25,000', value: '0.09 /Bean' },
  { slab: 'Slab 02', range: '25,001 – 1,00,000', value: '0.095 /Bean' },
  { slab: 'Slab 03', range: '1,00,001 +', value: '0.10 /Bean' },
]

export type Gift = {
  id: string
  name: string
  price: string
  status: 'Active' | 'Inactive'
}

export const gifts: Gift[] = [
  { id: 'rose', name: 'Rose', price: '10', status: 'Active' },
  { id: 'crown', name: 'Crown', price: '500', status: 'Active' },
  { id: 'rocket', name: 'Rocket', price: '1000', status: 'Active' },
]


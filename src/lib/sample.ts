/**
 * Sample data shown in "Preview" mode while an operations endpoint doesn't exist on the backend
 * yet (see lib/ops.ts). Shapes match the backend spec exactly, so the same page code renders real
 * data unchanged once it arrives. Deterministic — the same ids always produce the same records.
 */
type Q = Record<string, string | number | undefined>

const USERS = [
  { id: 'u_1042', name: 'Rahul K' },
  { id: 'u_1043', name: 'Aditya S' },
  { id: 'u_1044', name: 'Kabir M' },
  { id: 'u_1045', name: 'Arjun P' },
  { id: 'u_1046', name: 'Vikram R' },
]
const HOSTS = [
  { id: 'h_201', name: 'Priyanka' },
  { id: 'h_202', name: 'Sara' },
  { id: 'h_203', name: 'Meera' },
  { id: 'h_204', name: 'Ananya' },
]
const now = () => Date.now()
const ago = (min: number) => new Date(now() - min * 60_000).toISOString()
const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const seeded = (seed: string) => {
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return () => {
    h = (h * 1664525 + 1013904223) >>> 0
    return h / 2 ** 32
  }
}

/* ---------- Support ---------- */

const TICKETS = [
  { id: 'T-1008', subject: 'Charged but the call dropped after 20 seconds', category: 'billing', status: 'open', needsAgent: true, role: 'user', who: USERS[0], lastMessageAt: ago(6) },
  { id: 'T-1007', subject: 'Withdrawal pending for 5 days', category: 'payout', status: 'open', needsAgent: true, role: 'host', who: HOSTS[1], lastMessageAt: ago(34) },
  { id: 'T-1006', subject: 'Gift not received during live', category: 'gifts', status: 'open', needsAgent: false, role: 'host', who: HOSTS[0], lastMessageAt: ago(95) },
  { id: 'T-1005', subject: 'Camera shows black screen on calls', category: 'technical', status: 'open', needsAgent: false, role: 'user', who: USERS[2], lastMessageAt: ago(240) },
  { id: 'T-1004', subject: 'Recharge of ₹500 not credited', category: 'billing', status: 'closed', needsAgent: false, role: 'user', who: USERS[3], lastMessageAt: ago(900) },
  { id: 'T-1003', subject: 'Abusive caller keeps calling back', category: 'safety', status: 'open', needsAgent: true, role: 'host', who: HOSTS[2], lastMessageAt: ago(12) },
]
const toTicket = (t: (typeof TICKETS)[number]) => ({
  id: t.id, subject: t.subject, category: t.category, status: t.status, needsAgent: t.needsAgent,
  accountId: t.who.id, lastMessageAt: t.lastMessageAt, createdAt: t.lastMessageAt,
})
const toAccount = (t: (typeof TICKETS)[number]) => ({ id: t.who.id, name: t.who.name, phone: '+91 98•••• ••21', role: t.role })

// Same shape as GET /admin/support/tickets: rows of { ticket, account }.
export function tickets(q: Q) {
  const list = TICKETS.filter((t) =>
    (!q.status || q.status === 'all' || t.status === q.status) &&
    (q.needsAgent === undefined || String(t.needsAgent) === String(q.needsAgent)),
  ).map((t) => ({ ticket: toTicket(t), account: toAccount(t) }))
  return { tickets: list, total: list.length }
}

export function ticket(id: string) {
  const t = TICKETS.find((x) => x.id === id) ?? TICKETS[0]
  return {
    ticket: toTicket(t),
    messages: [
      { id: 'm1', sender: t.role, senderName: t.who.name, content: t.subject, createdAt: ago(120) },
      { id: 'm2', sender: 'bot', senderName: 'Support bot', content: 'Thanks — I checked your account and passed this to our team.', createdAt: ago(119) },
      { id: 'm3', sender: t.role, senderName: t.who.name, content: 'Please fix it soon, thank you.', createdAt: ago(60) },
    ],
  }
}

/* ---------- Calls ---------- */

export function liveCalls() {
  return {
    calls: [
      { id: 'c_9101', type: 'video', status: 'ongoing', userId: USERS[1].id, userName: USERS[1].name, hostId: HOSTS[0].id, hostName: HOSTS[0].name, startedAt: ago(7), ratePerMinutePaiseSnapshot: 6000 },
      { id: 'c_9102', type: 'voice', status: 'ongoing', userId: USERS[4].id, userName: USERS[4].name, hostId: HOSTS[3].id, hostName: HOSTS[3].name, startedAt: ago(19), ratePerMinutePaiseSnapshot: 3000 },
      { id: 'c_9103', type: 'video', status: 'ringing', userId: USERS[2].id, userName: USERS[2].name, hostId: HOSTS[1].id, hostName: HOSTS[1].name, startedAt: ago(0.3), ratePerMinutePaiseSnapshot: 8500 },
    ],
  }
}

const STATUSES = ['completed', 'completed', 'completed', 'missed', 'rejected', 'completed']
const END_REASONS: Record<string, string[]> = {
  completed: ['ended_by_user', 'ended_by_host', 'insufficient_balance', 'reaped_stale_ongoing'],
  missed: ['no_answer', 'cancelled_by_caller'],
  rejected: ['rejected_by_host'],
}
function makeCall(i: number) {
  const r = seeded(`call${i}`)
  const status = STATUSES[i % STATUSES.length]
  const type = r() > 0.35 ? 'video' : 'voice'
  const u = USERS[i % USERS.length]
  const h = HOSTS[i % HOSTS.length]
  const secs = status === 'completed' ? Math.round(60 + r() * 1100) : 0
  const rate = type === 'video' ? 6000 : 3000
  const paid = Math.round((secs / 60) * rate)
  const reasons = END_REASONS[status]
  return {
    id: `c_${9000 - i}`, type, status, userId: u.id, callerName: u.name, userName: u.name, hostId: h.id, hostName: h.name,
    ratePerMinutePaiseSnapshot: rate, startedAt: ago(i * 47 + 5), endedAt: ago(i * 47 + 5 - secs / 60),
    endReason: reasons[Math.floor(r() * reasons.length)], durationSeconds: secs, totalAmountPaise: paid, earnedPaise: Math.round(paid * 0.7),
    durationQuality: status !== 'completed' ? null : secs < 240 ? 'bad' : secs <= 600 ? 'good' : 'excellent', createdAt: ago(i * 47 + 5),
  }
}
const ALL_CALLS = Array.from({ length: 60 }, (_, i) => makeCall(i))

export function calls(q: Q) {
  let list = ALL_CALLS.filter((c) =>
    (!q.filter || q.filter === 'all' || (q.filter === 'missed' ? c.status === 'missed' : c.type === q.filter)) &&
    (!q.userId || c.userId === q.userId) && (!q.hostId || c.hostId === q.hostId),
  )
  if (q.q) {
    const s = String(q.q).toLowerCase()
    list = list.filter((c) => [c.id, c.userName, c.hostName].some((v) => v.toLowerCase().includes(s)))
  }
  const page = Number(q.page || 1), size = Number(q.pageSize || 20)
  return { calls: list.slice((page - 1) * size, page * size), total: list.length, page, pageSize: size, hasMore: page * size < list.length }
}

export function call(id: string) {
  return ALL_CALLS.find((c) => c.id === id) ?? liveCalls().calls.find((c) => c.id === id) ?? ALL_CALLS[0]
}

/* ---------- Live ---------- */

export function broadcasts() {
  return {
    broadcasts: [
      { id: 'b_71', title: 'Late night chill chat 💜', hostId: HOSTS[0].id, hostName: HOSTS[0].name, startedAt: ago(42), viewerCount: 128, giftBeans: 3400, commentsCount: 512 },
      { id: 'b_72', title: 'Sunday music 🎶', hostId: HOSTS[2].id, hostName: HOSTS[2].name, startedAt: ago(15), viewerCount: 47, giftBeans: 900, commentsCount: 133 },
    ],
  }
}

/* ---------- Gifts ---------- */

const GIFT_NAMES = ['Rose', 'Teddy bear', 'Diamond ring', 'Sports car', 'Castle', 'Rocket']
export function giftTransactions(q: Q) {
  const list = Array.from({ length: 24 }, (_, i) => {
    const r = seeded(`g${i}`)
    const gi = Math.floor(r() * GIFT_NAMES.length)
    const ctx = ['call', 'live', 'chat'][i % 3]
    return { id: `gt_${400 - i}`, giftName: GIFT_NAMES[gi], pricePaise: (gi + 1) * 5000, beans: (gi + 1) * 50, senderId: USERS[i % 5].id, senderName: USERS[i % 5].name, hostId: HOSTS[i % 4].id, hostName: HOSTS[i % 4].name, context: ctx, createdAt: ago(i * 23 + 3) }
  }).filter((t) => !q.context || q.context === 'all' || t.context === q.context)
  return { transactions: list, total: list.length }
}

export function giftRequests(q: Q) {
  const list = Array.from({ length: 10 }, (_, i) => ({
    id: `gr_${90 - i}`, hostId: HOSTS[i % 4].id, hostName: HOSTS[i % 4].name, userId: USERS[i % 5].id, userName: USERS[i % 5].name,
    suggestedGiftName: GIFT_NAMES[i % GIFT_NAMES.length], note: i % 3 === 0 ? 'You made my day 💖' : null,
    status: ['accepted', 'declined', 'pending'][i % 3], createdAt: ago(i * 41 + 2),
  })).filter((r) => !q.status || q.status === 'all' || r.status === q.status)
  return { requests: list, total: list.length }
}

/* ---------- Security ---------- */

export function securityEvents(q: Q) {
  const types = ['PAGE_HIDDEN', 'SCREENSHOT_ATTEMPT', 'SCREEN_RECORDING_SUSPECTED', 'PAGE_HIDDEN', 'DEVTOOLS_OPENED']
  const events = Array.from({ length: 18 }, (_, i) => {
    const isHost = i % 4 === 0
    const acct = isHost ? HOSTS[i % 4] : USERS[i % 5]
    return { id: `se_${700 - i}`, type: types[i % types.length], accountId: acct.id, accountName: acct.name, role: isHost ? 'host' : 'user', context: i % 2 ? 'call' : 'live', contextId: i % 2 ? `c_${9000 - i}` : 'b_71', createdAt: ago(i * 29 + 4) }
  }).filter((e) => (!q.role || q.role === 'all' || e.role === q.role) && (!q.type || q.type === 'all' || e.type === q.type))
  const counts = new Map<string, { accountId: string; accountName: string; role: string; count: number }>()
  for (const e of events) {
    const c = counts.get(e.accountId) ?? { accountId: e.accountId, accountName: e.accountName, role: e.role, count: 0 }
    c.count += 1
    counts.set(e.accountId, c)
  }
  return { events, repeatOffenders: [...counts.values()].filter((c) => c.count >= 3).sort((a, b) => b.count - a.count) }
}

/* ---------- Wallet ---------- */

export function wallet(userId: string) {
  const r = seeded(userId)
  const tx = [
    { id: 'tx1', type: 'recharge', amountPaise: 100000, reference: 'Razorpay pay_Q81kx', createdAt: ago(3000) },
    { id: 'tx2', type: 'call', amountPaise: -42000, reference: 'c_8999', createdAt: ago(2500) },
    { id: 'tx3', type: 'gift', amountPaise: -15000, reference: 'Teddy bear → Priyanka', createdAt: ago(2400) },
    { id: 'tx4', type: 'message', amountPaise: -8500, reference: 'Chat with Sara', createdAt: ago(1500) },
    { id: 'tx5', type: 'recharge', amountPaise: 50000, reference: 'Razorpay pay_Q9Za2', createdAt: ago(900) },
    { id: 'tx6', type: 'call', amountPaise: -Math.round(20000 + r() * 30000), reference: 'c_9000', createdAt: ago(60) },
  ]
  return { balancePaise: tx.reduce((a, t) => a + t.amountPaise, 0), transactions: tx.reverse() }
}

/* ---------- Host stats ---------- */

export function hostDaily(hostId: string, from: string, to: string) {
  const days = []
  for (let t = new Date(`${from}T00:00:00`).getTime(); t <= new Date(`${to}T00:00:00`).getTime(); t += 86_400_000) {
    const d = isoDay(new Date(t))
    const r = seeded(hostId + d)
    days.push({ date: d, earningsPaise: Math.round(40000 + r() * 90000), onlineSeconds: Math.round((2 + r() * 5) * 3600), callsCount: Math.round(4 + r() * 12) })
  }
  return { days }
}

export function hostSummary(hostId: string) {
  const r = seeded(hostId)
  const received = 120 + Math.round(r() * 60)
  const answered = Math.round(received * (0.8 + r() * 0.15))
  return {
    onlineSeconds: Math.round((25 + r() * 15) * 3600),
    earnings: { totalPaise: 612000, callsPaise: 402000, giftsPaise: 128000, livePaise: 64000, otherPaise: 18000 },
    calls: { received, answered, missed: received - answered - 4, rejected: 4, avgCallSeconds: Math.round(300 + r() * 240) },
    quality: { bad: Math.round(answered * 0.25), good: Math.round(answered * 0.45), excellent: Math.round(answered * 0.3) },
  }
}

/* ---------- Moderation conversation ---------- */

export function conversation(_reportId: string) {
  return {
    messages: [
      { id: 'cm1', senderId: USERS[0].id, senderName: USERS[0].name, senderRole: 'user', content: 'Hi, are you free?', createdAt: ago(300) },
      { id: 'cm2', senderId: HOSTS[1].id, senderName: HOSTS[1].name, senderRole: 'host', content: 'Hi! Yes, call me anytime 😊', createdAt: ago(295) },
      { id: 'cm3', senderId: USERS[0].id, senderName: USERS[0].name, senderRole: 'user', content: 'Give me your number, let’s talk outside the app.', createdAt: ago(290) },
      { id: 'cm4', senderId: HOSTS[1].id, senderName: HOSTS[1].name, senderRole: 'host', content: 'Sorry, I only talk here.', createdAt: ago(288) },
    ],
  }
}

/* ---------- Dashboard insights ---------- */

export function insights(from: string, to: string) {
  const series = []
  for (let t = new Date(`${from}T00:00:00`).getTime(); t <= new Date(`${to}T00:00:00`).getTime(); t += 86_400_000) {
    const d = isoDay(new Date(t))
    const r = seeded('ins' + d)
    series.push({ date: d, revenuePaise: Math.round(800000 + r() * 900000), callMinutes: Math.round(900 + r() * 1400) })
  }
  return {
    revenueSeries: series,
    callsByType: { video: 1840, voice: 960 },
    callsByStatus: { completed: 2310, missed: 380, rejected: 110 },
    missedRate: 0.136,
    avgCallSeconds: 412,
    hostsOnlineNow: 37,
    topByOnlineTime: HOSTS.map((h, i) => ({ hostId: h.id, hostName: h.name, onlineSeconds: (48 - i * 7) * 3600 })),
  }
}

/* ---------- App settings ---------- */

export function appSettings() {
  return {
    dailyGoalSeconds: 6 * 3600,
    callQuality: { goodFromSeconds: 240, excellentFromSeconds: 601 },
    messagePrice: { minPaise: 500, maxPaise: 10000 },
    liveCommentMaxLength: 2000,
  }
}

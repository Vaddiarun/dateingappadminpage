/**
 * Ready-made help articles for the support bot, written from how the Host and User apps work
 * today. Anything only the business knows is marked [fill in] — the Support Bot page won't add
 * an article to the bot until every [fill in] is replaced, so the bot never repeats a placeholder.
 */
export type Audience = 'host' | 'user' | 'all'
export type DraftArticle = { key: string; title: string; audience: Audience; content: string }

export const FILL_IN = '[fill in'

export const DRAFT_ARTICLES: DraftArticle[] = [
  {
    key: 'withdrawals',
    title: 'Withdrawals: how and when you get paid',
    audience: 'host',
    content: `To withdraw, your KYC must be approved and you need a payout method (bank account or UPI) in Settings → Payout details.

Go to Earnings → Withdraw, enter the amount and confirm. The confirm screen shows exactly what you will receive after the processing fee and TDS.

The minimum withdrawal is ₹10.
Money reaches your bank in 2–3 business days.
Withdrawals above ₹[fill in amount] are checked manually before they are paid.

You can follow every request in Settings → My Withdrawals, where each one also has an invoice.
If a withdrawal is rejected, check your bank or UPI details in Payout details and try again.

People may ask: "withdrawal pending", "money not received", "paisa nahi aaya", "payment kab aayega".`,
  },
  {
    key: 'kyc',
    title: 'KYC verification',
    audience: 'host',
    content: `KYC is needed before your first withdrawal.

Steps: upload a clear photo of a government ID (front and back) and add your payout details. The name and photo must be easy to read — blurry, cropped or expired documents are rejected.

Review takes [fill in] business days. You can see your status in Settings → KYC Details.

If your KYC is rejected, the reason is shown in KYC Details. Fix the problem and submit again with the "Update KYC" button.

People may ask: "KYC rejected", "KYC pending", "verification kab hoga".`,
  },
  {
    key: 'levels',
    title: 'Beans, levels and your prices',
    audience: 'host',
    content: `1 bean = 1 paisa, so 100 beans = ₹1.

Everyone starts at Level 1. At Level 1 you can charge up to ₹30/min for video calls, ₹20/min for voice calls and ₹5 per message.

You move up one level for every 1,00,000 beans you earn from calls, gifts, messages and live streams. There are 20 levels. Each level raises your maximum video, voice and message price by ₹20.

Levels go up automatically and never go down. Withdrawing your beans does not lower your level.

You can charge less than your maximum in Settings → Rate settings. Leave a rate empty to always charge your level's price.`,
  },
  {
    key: 'call-earnings',
    title: 'Call earnings and call quality',
    audience: 'host',
    content: `Calls are charged per minute at the rate you had when the call started.
You earn your share after the platform commission of [fill in]%.

Every call gets a quality band:
- under 4 minutes: Bad
- 4 to 10 minutes: Good
- over 10 minutes: Excellent

A call ends automatically if the user's balance runs out.

Your totals are in Earnings and in the Daily report (online time, calls, gifts and other earnings for any day).`,
  },
  {
    key: 'gifts-host',
    title: 'Gifts and live streams',
    audience: 'host',
    content: `Users can send you gifts during calls, in chat and while you are live. You receive beans for every gift.

During a call you can tap "Ask gift" to suggest a gift, with an optional short note.
Gifts sent while you are live also appear in your live comments with the sender's name.

Gift values: [fill in, or say "see the gift list in the app"].

People may ask: "gift not received", "gift beans kitne milte hain".`,
  },
  {
    key: 'availability',
    title: 'Going online, live and availability',
    audience: 'host',
    content: `Use the Online toggle on Home to start receiving calls. When you are offline, users can't call you.

Settings → Availability:
- Auto-accept calls connects incoming calls without tapping Accept.
- "Voice calls only after 12 AM" turns off video calls late at night.

To go live, open Live, choose your settings and tap Go live. Viewers can comment and send gifts.`,
  },
  {
    key: 'recharge',
    title: 'Recharge and talktime balance',
    audience: 'user',
    content: `Add money from Wallet → Add balance. Payments are made securely through Cashfree.

Recharge packs: [fill in the packs and any bonus].

If you paid but the balance was not added, it usually updates within [fill in] minutes. If it still hasn't, contact support with the payment ID from your bank or UPI app.

People may ask: "recharge not added", "paisa kat gaya balance nahi aaya", "payment failed".`,
  },
  {
    key: 'charges',
    title: 'How calls and messages are charged',
    audience: 'user',
    content: `Each creator sets their own price for video calls, voice calls and messages. You can see the price before you call or message.

Calls are charged per minute while you are connected. You get a low-balance warning, and the call ends when your balance runs out.

Each message to a creator costs that creator's message price.

If a call dropped and you think you were charged wrongly, our team will check it — support will pass this to a person.`,
  },
  {
    key: 'vip',
    title: 'VIP subscription',
    audience: 'user',
    content: `VIP gives you: [fill in the benefits].

Price and duration: [fill in].

Renewal and cancelling: [fill in — does it renew automatically, and how to cancel].

You can see your plan in Settings → Active Subscriptions.`,
  },
  {
    key: 'gifts-user',
    title: 'Sending gifts',
    audience: 'user',
    content: `You can send a gift to a creator during a call, in chat or while they are live. Tap the gift button and choose a gift. The price is paid from your balance.

After you send a gift in chat, a "Gift sent" card appears in the conversation.

Refunds for gifts: [fill in your policy].`,
  },
  {
    key: 'account',
    title: 'Age verification and your account',
    audience: 'user',
    content: `You must be 18 or older to use the app, and age verification is required when you sign up.

If your account is restricted, it is because of a safety review. Support will pass these questions to a person.

To delete your account, go to Settings → Delete Account. What happens to your remaining balance: [fill in].`,
  },
  {
    key: 'safety',
    title: 'Safety: blocking and reporting',
    audience: 'all',
    content: `You can block or report someone from the call screen, the chat or their profile.

People you block can't call or message you. You can unblock them in Settings → Blocked users.

Every report is reviewed by our team. Support cannot promise what the outcome will be.

Recording calls or taking screenshots is not allowed. Nudity, or asking to meet or share contact details outside the app, leads to removal or a ban.`,
  },
  {
    key: 'referrals',
    title: 'Referrals',
    audience: 'all',
    content: `Your referral code is in Settings → Refer and Earn. Use "Share link" — when a friend opens it, your code is filled in on the sign-up screen. They can also type it under "Have a referral code?".

A code only counts when it is used to create a new account.

Referral rewards: [fill in, or say "coming soon"].`,
  },
  {
    key: 'app-problems',
    title: 'App problems: camera, call quality, login',
    audience: 'all',
    content: `Camera or mic not working: allow camera and microphone permission for the app in your phone settings, then reopen the app.

Black video or poor quality: use Wi-Fi or a strong 4G/5G signal, keep the app open during the call, and face a light source.

OTP not received: check the number, wait 30 seconds and tap Resend.

If the problem continues, tell support your phone model and what you see.`,
  },
]

export const hasPlaceholder = (text: string) => text.toLowerCase().includes(FILL_IN)

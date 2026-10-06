# Admin, support and call-ops API spec

**Audience:** backend team
**Status:** the frontend is built and waiting on these endpoints.

## Scope

This spec covers the endpoints behind:
- new admin screens: Support, Calls, Live Monitor, Gift Activity, Security Events and App Settings;
- new tabs on existing admin pages: user Wallet & refunds and Calls, host Performance and Calls, moderation chat review, and dashboard insights;
- the in-app support chat in the host and user apps.

## How the frontend behaves before an endpoint ships

- If an endpoint returns **404 or 501**, the admin dashboard shows labelled sample data with a "Preview" banner and disables every action on that screen.
- Once the endpoint returns 2xx, the real data appears with no frontend change.
- Any other error status is shown as a normal error.
- **Please return 404 (not 500) for routes you haven't built yet.**

## Conventions

These match the existing `/admin/*` API:

| Topic | Convention |
|---|---|
| Auth | Admin bearer token. Host and user routes use their existing tokens. |
| Money | Integer **paise**. Signed where it's a ledger movement. |
| Durations | Integer **seconds**. |
| Timestamps | ISO-8601 UTC. |
| Dates (`from`, `to`) | Local `YYYY-MM-DD`, with an optional `tz` (IANA name, default `Asia/Kolkata`). |
| Lists | Include `total`. Paged lists take `page` (1-based) and `pageSize`, and return `hasMore`. |
| Audit log | Every admin **write** here creates an audit-log entry with the admin id, target, before/after values and reason. The UI tells admins this happens. |

---

## 1. Support tickets

### Admin endpoints

**`GET /admin/support/tickets`**
- Query parameters:
  - `status`: `open | in_progress | waiting_on_customer | resolved | closed | all`
  - `role`: `user | host`
  - `category`: `billing | payout | gifts | technical | safety | account | other`
  - `q`
  - `page`, `pageSize`

```json
{ "tickets": [{
    "id": "T-1008", "subject": "Charged but the call dropped", "category": "billing",
    "priority": "low|medium|high|urgent", "status": "open", "role": "user",
    "requester": { "id": "u_1042", "name": "Rahul K" },
    "refs": { "callId": "c_9001", "withdrawalId": null },
    "assigneeId": null, "createdAt": "…", "updatedAt": "…", "lastMessageAt": "…"
  }], "total": 1 }
```

**`GET /admin/support/tickets/:id`** returns the ticket plus its thread:

```json
{ "ticket": { "...same fields as the list...": "", "summary": "Bot's one-paragraph summary" },
  "messages": [{ "id": "m1", "sender": "user|host|bot|agent", "senderName": "Rahul K",
                 "content": "…", "attachments": [], "createdAt": "…" }] }
```

**`POST /admin/support/tickets/:id/messages`**
- Body: `{ "content": "…" }`
- Adds an `agent` message and pushes it to the requester in the app (socket event `support:message`, plus a push notification).

**`PATCH /admin/support/tickets/:id`**
- Body: any of `{ "status", "priority", "assigneeId" }`.

### App endpoints (host and user apps)

Each app uses its own auth prefix: `/host/me/…` and `/user/me/…`.

| Endpoint | Purpose |
|---|---|
| `GET /…/me/support/tickets` | The caller's tickets, same shape as the admin list. |
| `POST /…/me/support/tickets` | Create a ticket. Body: `{ subject, category, content, refs?: { callId?, withdrawalId? } }`. |
| `GET /…/me/support/tickets/:id` | The thread. Same shape as the admin detail, without `summary`. |
| `POST /…/me/support/tickets/:id/messages` | Reply. Body: `{ content }`. |

**Optional (phase 2): support bot.** `POST /…/me/support/assistant`
- Body: `{ ticketId?, content }`
- The server calls Claude (model `claude-opus-5`) with the caller's recent calls, wallet and withdrawals as context.
- It replies as a `bot` message, and creates or escalates a ticket when the bot can't resolve the issue.
- **The Anthropic API key stays on the server and is never sent to the apps.**

---

## 2. Calls

**`GET /admin/calls/live`** returns calls in progress (`ringing` or `ongoing`):

```json
{ "calls": [{ "id": "c_9101", "type": "video|voice", "status": "ongoing",
              "userId": "u_1043", "userName": "Aditya S", "hostId": "h_201", "hostName": "Priyanka",
              "startedAt": "…", "ratePerMinutePaiseSnapshot": 6000 }] }
```

**`GET /admin/calls`** returns call history.
- Query parameters:
  - `filter`: `all | video | voice | missed`
  - `userId`, `hostId`
  - `q` (matches call id, user name or host name)
  - `from`, `to`
  - `page`, `pageSize`
- The admin user and host pages call it with `userId` or `hostId`.

```json
{ "calls": [{ "id": "c_9000", "type": "video", "status": "completed|missed|rejected|failed",
              "endReason": "ended_by_user|ended_by_host|insufficient_balance|no_answer|…",
              "userId": "…", "userName": "…", "hostId": "…", "hostName": "…",
              "startedAt": "…", "endedAt": "…", "durationSeconds": 412,
              "ratePerMinutePaiseSnapshot": 6000, "totalAmountPaise": 41200, "earnedPaise": 28840,
              "durationQuality": "bad|good|excellent|null", "createdAt": "…" }],
  "total": 60, "page": 1, "pageSize": 20, "hasMore": true }
```

- **`GET /admin/calls/:id`**: one call, with the same fields as a history row. Either a bare object or `{ "call": {…} }` works.
- **`POST /admin/calls/:id/end`**:
  - Body: `{ "reason": "…" }`.
  - Ends the call for both sides, the same way as a normal hang-up, using `endReason: "ended_by_admin"`.
  - Bills the call up to the moment it was ended.
  - Returns 409 if the call has already ended.

---

## 3. Live broadcasts

**`GET /admin/live/broadcasts?status=live`**

```json
{ "broadcasts": [{ "id": "b_71", "title": "…", "hostId": "h_201", "hostName": "Priyanka",
                   "startedAt": "…", "viewerCount": 128, "giftBeans": 3400, "commentsCount": 512 }] }
```

**`POST /admin/live/broadcasts/:id/end`**
- Body: `{ "reason" }`.
- Takes the host off air and disconnects viewers.

---

## 4. Gifts

**`GET /admin/gifts/transactions`**
- Query parameters: `context=call|live|chat`, `hostId`, `userId`, `from`, `to`, `page`, `pageSize`.

```json
{ "transactions": [{ "id": "gt_400", "giftName": "Rose", "pricePaise": 5000, "beans": 50,
                     "senderId": "u_1042", "senderName": "Rahul K", "hostId": "h_201", "hostName": "Priyanka",
                     "context": "call", "createdAt": "…" }], "total": 24 }
```

**`GET /admin/gifts/requests`**
- Query parameters: `status=pending|accepted|declined`, `hostId`, `page`, `pageSize`.
- These are the host → user gift requests that already exist in the host app.

```json
{ "requests": [{ "id": "gr_90", "hostId": "…", "hostName": "…", "userId": "…", "userName": "…",
                 "suggestedGiftName": "Rose", "note": "You made my day", "status": "accepted", "createdAt": "…" }], "total": 10 }
```

---

## 5. Security events

**`GET /admin/security-events`**
- Query parameters: `role=user|host`, `type`, `accountId`, `from`, `to`, `page`, `pageSize`.
- Events come from the screenshot and recording protection already in both apps.
- Event types: `SCREENSHOT_ATTEMPT`, `SCREEN_RECORDING_SUSPECTED`, `PAGE_HIDDEN`, `DEVTOOLS_OPENED`.

```json
{ "events": [{ "id": "se_700", "type": "SCREENSHOT_ATTEMPT", "accountId": "u_1042", "accountName": "Rahul K",
               "role": "user", "context": "call|live", "contextId": "c_9000", "createdAt": "…" }],
  "repeatOffenders": [{ "accountId": "u_1042", "accountName": "Rahul K", "role": "user", "count": 5 }] }
```

- `repeatOffenders` lists accounts with **3 or more** events in the filtered window, highest count first.

---

## 6. User wallet & refunds

**`GET /admin/users/:id/wallet`**

```json
{ "balancePaise": 84500,
  "transactions": [{ "id": "tx6", "type": "recharge|call|gift|message|refund|adjustment",
                     "amountPaise": -42000, "reference": "c_8999", "createdAt": "…" }] }
```

- `amountPaise` is signed: positive adds to the balance, negative takes from it.
- Return transactions newest first.

**`POST /admin/users/:id/adjustments`**
- Body: `{ "amountPaise": 12000, "reason": "Call dropped after 20s", "reference": "c_9001" }`
  - `amountPaise` is signed. Positive is a credit or refund; negative is a correction.
  - `reason` is required, at least 5 characters.
  - `reference` is optional.
- Writes an `adjustment` ledger row, or a `refund` row when `reference` is a call id, and updates the balance atomically.
- Rejects a debit that would take the balance below 0, with a 422 and a clear message.
- Adjustments are never deleted; a mistake is fixed with an opposite adjustment.

---

## 7. Host performance

These are admin views of the host's own daily-stats data.

**`GET /admin/hosts/:id/stats/daily-summary?from&to`**

```json
{ "days": [{ "date": "2026-09-29", "earningsPaise": 84000, "onlineSeconds": 19800, "callsCount": 11 }] }
```

- Return one row per day in the range, including zero days.

**`GET /admin/hosts/:id/stats/summary?from&to`**

```json
{ "onlineSeconds": 118800,
  "earnings": { "totalPaise": 612000, "callsPaise": 402000, "giftsPaise": 128000, "livePaise": 64000, "otherPaise": 18000 },
  "calls": { "received": 150, "answered": 131, "missed": 15, "rejected": 4, "avgCallSeconds": 412 },
  "quality": { "bad": 33, "good": 59, "excellent": 39 } }
```

---

## 8. Moderation: reported chat

**`GET /admin/moderation/:reportId/conversation`**
- Returns the chat messages between the reporter and the reported account, most recent 200, oldest first.
- Each view creates an audit-log entry, because admins are reading private messages.

```json
{ "messages": [{ "id": "cm1", "senderId": "u_1042", "senderName": "Rahul K", "senderRole": "user",
                 "content": "…", "createdAt": "…" }] }
```

---

## 9. Dashboard insights

**`GET /admin/dashboard/insights?from&to`** (the dashboard asks for the last 14 days)

```json
{ "revenueSeries": [{ "date": "2026-09-16", "revenuePaise": 1250000, "callMinutes": 1840 }],
  "callsByType": { "video": 1840, "voice": 960 },
  "callsByStatus": { "completed": 2310, "missed": 380, "rejected": 110 },
  "missedRate": 0.136,
  "avgCallSeconds": 412,
  "hostsOnlineNow": 37,
  "topByOnlineTime": [{ "hostId": "h_201", "hostName": "Priyanka", "onlineSeconds": 172800 }] }
```

- `missedRate` is `missed / (completed + missed + rejected)`, from 0 to 1.
- `topByOnlineTime` lists up to 5 hosts.

---

## 10. App settings

These values are hard-coded in the apps today.

**`GET /admin/config/app-settings`** and **`POST /admin/config/app-settings`** (same body)

```json
{ "dailyGoalSeconds": 21600,
  "callQuality": { "goodFromSeconds": 240, "excellentFromSeconds": 601 },
  "messagePrice": { "minPaise": 500, "maxPaise": 10000 },
  "liveCommentMaxLength": 2000 }
```

- **Validation** (return 422 when it fails):
  - every value is greater than 0;
  - `dailyGoalSeconds` is at most 86400;
  - `excellentFromSeconds` is greater than `goodFromSeconds`;
  - `maxPaise` is at least `minPaise`.
- **Reading the settings:**
  - Expose the same values read-only to the apps, for example inside the existing `/host/me` or a public `GET /config/app-settings`, so the host app stops hard-coding its 6-hour goal.
  - The existing `durationQuality` calculation should read these bands.

---

## 11. Photos in chat (host ↔ user, including during a call)

Both apps now let people send a photo from the in-call chat. The regular Chat screens also display photos. Today the apps show "Sending photos isn't switched on yet" because the endpoint below returns 404.

The flow uses the same presign-then-save pattern as avatar and gallery uploads:

1. The app shrinks the photo to a JPEG, at most 1280 px on the long edge (about 150–300 KB).
2. The app calls **`POST /chat/attachments/upload-url`** with body `{ "recipientId": "…", "contentType": "image/jpeg" }`, which returns:
   ```json
   { "uploadUrl": "https://s3…presigned PUT…", "mediaKey": "chat/<conversationId>/<uuid>.jpg", "expiresIn": 300 }
   ```
   - Only allow `image/jpeg`, `image/png` and `image/webp`.
   - Cap the size at 5 MB with a presigned-POST condition, or check it after upload.
   - Refuse the request if the sender isn't allowed to message the recipient, using the same rule as `POST /chat/messages`.
3. The app PUTs the file to `uploadUrl` with `Content-Type` set to that content type. **The S3 bucket CORS must allow PUT from both app origins.**
4. The app calls **`POST /chat/messages`** with body `{ "recipientId": "…", "type": "image", "mediaKey": "chat/…", "content": "" }`.
   - `content` is an optional caption.
   - Check that `mediaKey` was issued to this sender and that the object exists.
   - The response is the usual message plus `type` and `mediaUrl`:
   ```json
   { "messageId": "…", "conversationId": "…", "senderId": "…", "type": "image",
     "content": "", "mediaUrl": "https://…signed GET, ~1 h…", "createdAt": "…" }
   ```

**Message shape everywhere.** Messages must include `type` (`"text"` or `"image"`) and, for photos, `mediaUrl`, in all three places:
- the `chat:message` socket event;
- `GET /chat/conversations/:id/messages`;
- the `POST /chat/messages` response.

Old text messages can omit `type`. Keep the bucket private and return a fresh signed GET URL each time a message is served.

**Billing.** Charge a photo like a text message: the same per-message price, if the chat is paid. The app doesn't add a charge of its own.

**Safety.** This is a dating app, so:
- run uploaded photos through automated image moderation (for example AWS Rekognition `DetectModerationLabels`) before or right after delivery;
- let a message be reported like any other;
- include photos in the admin moderation "Chat between them" view (section 8), returning `type` and `mediaUrl` there too.

---

## 12. Gifts during a live broadcast

When a viewer sends a gift during a live broadcast:
- the host app now adds "Rahul sent a Rose 🎁" to the live comments;
- the user app shows the same line to **every** viewer in the room, not just the sender.

The apps need two things from the backend:

1. **Add `context` and `broadcastId` to the host's existing `gift:received` event.** This lets the host app tell a live gift from a call gift:
   ```json
   { "gift": { "id": "…", "name": "Rose" }, "beansCredited": 50, "senderId": "u_1042", "senderName": "Rahul K",
     "context": "live", "broadcastId": "b_71" }
   ```
   Until these fields are added, the host app treats any gift that arrives while the host is live as a live gift.

2. **Add a new `live:gift` event, sent to the broadcast's socket room** (the same room that gets `live:chat`):
   ```json
   { "broadcastId": "b_71", "senderId": "u_1042", "senderName": "Rahul K",
     "gift": { "id": "…", "name": "Rose" }, "createdAt": "…" }
   ```
   - Send it whenever `POST /gifts/send` succeeds with context `live`.
   - Until it exists, viewers only see the gifts they send themselves.

---

## 13. Gifts sent from a chat

When a user sends a gift from a chat (`POST /gifts/send` with context `chat`), the user app now keeps the user in the conversation and shows a "Gift sent" card there. Today that card is saved only on the user's own phone.

**Please also save the gift as a chat message** in that conversation:

```json
{ "id": "…", "conversationId": "…", "senderId": "u_1042", "type": "gift",
  "gift": { "id": "…", "name": "Rose", "iconUrl": "https://…" }, "content": "", "createdAt": "…" }
```

- Return it from `GET /chat/conversations/:id/messages`.
- Send it in the `chat:message` socket event.

**What this fixes:**
- The host sees the gift in their chat, not just the popup.
- The card stays when the user changes phone.

The user app already displays `type: "gift"` messages and won't show a gift twice.

---

## 14. New host profile & settings screens

The host app has new screens: Profile header, Edit profile, KYC details, My withdrawals, Invoice, My earnings, Refer & earn, My referrals and Support chat. They work with today's API, but a few parts stay empty or say "coming soon" until the backend sends the following.

| Screen | What's needed | Shape |
|---|---|---|
| Profile header | Lifetime stats on `GET /me` under `hostProfile.stats`. Today the cards show "—". | `{ "followersCount": 8400, "talkTimeSeconds": 100800, "giftsReceivedCount": 1100 }` |
| Profile header / Edit profile | Fields on `GET /me`. | `username` (shown as `@ayesha_live`), `hostingId` (for example `HST-1130`; the app currently builds one from the id), `dateOfBirth` (`YYYY-MM-DD`) |
| Edit profile | Store `interests` on `PATCH /me/host-profile` and return it on `GET /me`. | `{ "interests": { "interests": ["Pets"], "hobbies": ["Cooking"], "sports": [], "film": [], "music": [], "traveling": [], "food": [] } }`. Values are free text. |
| KYC details | The bean threshold for withdrawing, on `GET /config`. The "Your balance is lower than the withdrawal limit" note only shows once this exists. | `{ "minWithdrawalBeans": 250000 }` |
| My withdrawals / Invoice | Include `createdAt` (and `processingFeePaise`, `tdsPaise`, `netPayoutPaise`, `convertedAmountPaise`) on `GET /withdrawals` items. Return the list as `{ "withdrawals": [...] }`. | as `GET /withdrawals/:id` today |
| Invoice | Company details for the "Billed to" box: legal name, registered address, GSTIN. Either add them to `GET /config` as `invoiceCompany`, or send them so they can be hard-coded. Today the box shows placeholders. | `{ "invoiceCompany": { "name": "…", "address": "…", "gstin": "…" } }` |
| My earnings | Optional: `beans` on each `GET /me/history` item. Until then the app converts paise to beans using `paisePerBean`. | `{ "beans": 800 }` |
| Refer & earn | `referralCode` on `GET /me`. | `"SPLASH25"` |
| My referrals | **`GET /me/referrals?type=streamers\|agents`** | `{ "referrals": [{ "id", "name", "joinedAt", "earnedForYouPaise" }] }` |
| Support chat | The host support endpoints from section 1, under the host's normal prefix: **`GET/POST /me/support/tickets`**, `GET /me/support/tickets/:id`, `POST /me/support/tickets/:id/messages`. The host's own messages should use `"sender": "host"`. | see section 1 |
| Blocked users | Already uses `GET /moderation/blocks`. Please return `{ "blocks": [{ "user": { "id", "name", "avatarUrl" } }] }`. | |

---

## Suggested order

1. **Calls** (`/admin/calls`, `/admin/calls/live`, end call) and **user wallet + adjustments**. These are the most-used support tools.
2. **Support tickets**, both the admin and app endpoints.
3. **Host performance** and **dashboard insights**. These reuse the daily-stats aggregation that's already built.
4. **Gifts**, **security events**, **live monitor**, **moderation conversation** and **app settings**.

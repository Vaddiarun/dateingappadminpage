# TriloPlan Admin Dashboard

React + TypeScript + Vite admin dashboard for TriloPlan, wired to the real `/admin/*` backend described in `TriloPlan-Admin.postman_collection.json`.

## Setup

```bash
npm install
cp .env.example .env.local   # then set VITE_API_BASE_URL to your backend
npm run dev
```

`VITE_API_BASE_URL` defaults to `http://localhost:4000` if unset. There's no admin signup flow by design — provision an admin out-of-band (`npm run db:seed-admin -- <phone> <email> <password>` on the backend) and sign in with that email/password on `/login`.

## Architecture

- `src/lib/api.ts` — typed fetch wrapper + one function per `/admin/*` and `/auth/admin/*` endpoint in the Postman collection.
- `src/lib/auth.tsx` — token/session storage (`localStorage`) and the `RequireAuth` route guard.
- `src/lib/pick.ts` — defensive field readers (`pick`, `pickAny`, `unwrapList`) used throughout the pages, since the Postman collection documents request bodies but not response shapes. If a page renders `—` where you expect a value, the real field name differs from what's guessed here — check the network tab and adjust the relevant `pickAny(...)` candidates.
- `src/lib/configHistory.ts` — every `/admin/config/*` GET returns the *full change history*, newest first, not just the current value; these helpers collapse that down to what's in effect.
- `src/lib/useAsync.ts` — small loading/error/data hook wrapping the API calls.

The 10-item sidebar nav (Dashboard, Users, Hosts, KYC, Withdrawals, Pricing & Economics, Moderation, 18+ Mode, Audit Logs, Broadcast Messaging) intentionally excludes Sub-Admin management and Live Broadcasts, which exist in the Postman collection/backend but weren't part of the approved Figma design for this build.

## Notes on the API integration

- User/host account suspension (`Suspend`/`Ban`) is wired to `POST /admin/users/:id/status` for both the Users and Hosts pages — the collection only documents a user-status route, no separate host one. Repoint `setAccountStatus` in `src/lib/api.ts` if the backend has a dedicated host endpoint.
- The Moderation detail screen has no single-report GET in the collection, so it re-fetches the full queue and finds the report by id client-side.
- "Beans Earn-rate" reflects the real `/admin/config/beans-rate` field (`paisePerBean`, a bean's cash value), not the Figma mock's "1 call minute = N beans" framing — those are different concepts and the backend only exposes the former.

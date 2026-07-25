# Nomadic Frontend Audit — ETHGlobal Lisbon 2026

> Repository audited: `Nomadic-Accelerationism/nomadic-front`  
> Branch: `lisboa2026`  
> Product context: `docs/PROJECT_CONTEXT.md`  
> Audit date: 2026-07-24  
> Method: structure inspection, dependency install, lint/build/typecheck, route smoke tests, static code reading of auth/profile/journey/proof/house flows.  
> **Not verified:** live Magic/Privy login with real keys, live backend responses, end-to-end claim uniqueness.

---

## 1. Executive summary

`nomadic-front` is a **Next.js 14 App Router** mobile-oriented frontend for Nomadic. It already contains substantial UI and domain concepts around:

- email login via **Magic** (user path);
- wallet-assisted proof verification via **Privy** (proofs path only);
- **Proofs** as wallet-checked credentials / eligibility signals;
- **Journeys** as hosted stays/events with required proofs, budget, capacity, and status;
- **Hacker house** screens that are largely **mock UI**, partly overlapping with Journey detail.

There is **no first-class “Passport” page or public profile route**. Identity today is `localStorage` (`didToken`, `publicAddress`, `userMetadata`) plus a proofs list. Team intent (from product discussion) is that Passport ≈ this identity/proofs surface and that Proof ≈ Credential conceptually — but that reuse still needs product shaping, not a rename.

**Build status after a minimal audit fix:** production build succeeds without env secrets. TypeScript still reports errors (ignored by `next.config.mjs`). Lint passes with warnings. No automated tests. Runtime auth and API behaviour remain **blocked** without configured env + live backend.

**Recommendation:** **evolve this frontend** (option A in §20), with a focused Lisbon slice; do not start a clean app.

---

## 2. Technology stack

| Area | Observed |
| --- | --- |
| Framework | Next.js **14.2.5** (App Router) |
| Language | TypeScript (`strict: true`) |
| UI | React 18, Tailwind CSS 3.4, Radix/shadcn-style `components/ui/*` |
| Fonts | Local **Satoshi** (`next/font/local`); Inter imported in layout but not applied to body |
| Auth (login) | **Magic SDK** email OTP (`magic-sdk`) |
| Auth (wallet proofs) | **Privy** (`@privy-io/react-auth`) — used in proofs verification flow |
| Data fetching | **Axios** (`lib/axios.ts` + direct `axios` calls), **TanStack React Query** |
| State | React Context (`UserContext`) + `localStorage`; no Redux/Zustand |
| Package manager | **npm** (`package-lock.json`) |
| Tests | None (no `test` script, no test files) |
| Backend access | Next.js route handlers under `app/api/auth/*` proxying to `NEXT_PUBLIC_NOMADIC_API_URL` |

Notable config risks in `next.config.mjs`:

- `eslint.ignoreDuringBuilds: true`
- `typescript.ignoreBuildErrors: true` (duplicated)
- `experimental.env.NODE_TLS_REJECT_UNAUTHORIZED: '0'` (TLS verification disabled in experimental env — security risk)

---

## 3. Repository structure

Important files/directories only (excluding `node_modules`, `.next`):

```text
nomadic-front/
├── app/
│   ├── layout.tsx                 # UserProvider, React Query, conditional PrivyProvider
│   ├── page.tsx                   # Landing
│   ├── globals.css
│   ├── login-user/                # Magic email login
│   ├── login-house/               # House login UI (no real auth)
│   ├── home-user/                 # Nomad home → Proofs / Journeys
│   ├── home-house/                # House home → mock house list
│   ├── user-proofs/               # My Proofs (Privy + backend list/verify)
│   ├── hacker-journeys/           # Discover + own journeys + create CTA
│   ├── journey-create|edit|preview|apply|success/
│   ├── house-detail/              # Journey-as-house detail + mock participants
│   ├── nacc-tokens/               # Mock token UI
│   ├── generate-single-use-id/    # Mock ID generator UI
│   └── api/auth/                  # BFF proxies to Nomadic API
│       ├── validate-otp/
│       ├── create-journey/
│       ├── update-journey/
│       ├── update-journey-edit/
│       ├── get-all-journeys/
│       ├── get-hacker-journeys/
│       ├── get-journey/
│       ├── get-proof-hacker-list/
│       ├── get-poaps|get-talent|get-nouns|get-ape|get-azuki|get-builder/
│       └── [...route]/           # Incomplete catch-all (no HTTP handlers exported)
├── components/                    # Feature screens + ui primitives + modals
├── contexts/UserContext.tsx
├── services/auth-service.ts       # Bearer token helpers (localStorage didToken)
├── lib/axios.ts                   # Axios client + auth interceptor
├── interfaces/                    # Journey, ProofItem, Participant*
├── hooks/useProofSelection.ts
├── data/locations.ts
├── types/location.ts
├── public/{images,proofs,icons,fonts}/
├── docs/PROJECT_CONTEXT.md
├── package.json / package-lock.json
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── .env.example
```

---

## 4. Commands executed

| Command | Purpose | Result |
| --- | --- | --- |
| `npm ci` | Install from lockfile | Success (925 packages) |
| `npx next lint` | ESLint | Exit 0 — 3 warnings |
| `npx tsc --noEmit` | Typecheck | Exit 2 — errors (see §5) |
| `npm run build` (before fix) | Production build | Exit 1 — Privy invalid app ID on prerender |
| `npm run build` (after minimal fix) | Production build | Exit 0 |
| `npm test` | Automated tests | Exit 1 — no `test` script |
| `npm run dev` | Dev server | Started; routes returned HTTP 200 |
| `curl` smoke tests | `/`, `/login-user`, `/home-user`, `/user-proofs`, `/hacker-journeys`, `/login-house` | 200 |
| `curl` POST `/api/auth/validate-otp` `{}` | API guard | 401 `{ error: Authorization token required }` |

---

## 5. Build, lint and type-check status

### Lint — pass with warnings

- `components/JourneyCreate.tsx` — `react-hooks/exhaustive-deps`
- `components/JourneyPreview.tsx`, `components/modals/successful-modal.tsx` — `@next/next/no-img-element`

### TypeScript — fail (errors present; ignored by Next build)

| File | Issue |
| --- | --- |
| `components/AvailableJourneys.tsx` | implicit `any` on map callbacks |
| `components/UserProofs.tsx` | incomplete `DialogState` update missing `xAccount`; implicit `any` |
| `lib/axios.ts` | Axios headers typing mismatch |

`next.config.mjs` sets `ignoreBuildErrors` / `ignoreDuringBuilds`, so production builds can succeed while types are wrong.

### Production build

- **Before fix:** failed prerendering nearly all pages: `Cannot initialize the Privy provider with an invalid Privy app ID` (empty `NEXT_PUBLIC_PRIVY_APP_ID`).
- **After minimal audit fix:** succeeds (33 static pages generated).

### Tests

None.

### Demo impact

- Missing env + backend still block real login/proofs/journeys.
- Type errors do not currently block Next build, but they increase breakage risk.
- TLS reject-unauthorized override is a deploy/security concern.

---

## 6. Required environment-variable names (no values)

From `.env.example` and code references:

| Name | Used for |
| --- | --- |
| `NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY` | Magic email OTP login / re-auth on cancel flow |
| `NEXT_PUBLIC_PRIVY_APP_ID` | PrivyProvider + wallet login inside proofs verification |
| `NEXT_PUBLIC_NOMADIC_API_URL` | Base URL for backend proxies in `app/api/auth/*` |

No `.env` / `.env.local` was present in the audit environment.

---

## 7. Authentication flow

### Providers in play

1. **Magic (primary user login)** — `components/LoginUser.tsx`  
   - Email → `magic.auth.loginWithEmailOTP` → Magic DID token  
   - `magic.user.getInfo()`  
   - POST `/api/auth/validate-otp` with `{ email, didToken }`  
   - Stores `didToken`, `userMetadata`, `publicAddress` via `UserContext` / `localStorage`  
   - Redirects to `/home-user`

2. **Privy (wallet for proof verification only)** — `components/UserProofs.tsx`  
   - `useLogin` / `usePrivy`  
   - On complete: uses `user.wallet.address` to call proof verification endpoints, then `logout()` from Privy  
   - Does **not** replace Magic session as the app’s primary auth

3. **House login** — `components/LoginHouse.tsx`  
   - UI only; submit button is wrapped in `<Link href="/home-house">`  
   - **No Magic/Privy/API call** — effectively unauthenticated bypass

### Session / token storage

| Key | Location | Meaning in code |
| --- | --- | --- |
| `didToken` | `localStorage` + context | Magic DID token; sent as Bearer to BFF/backend |
| `publicAddress` | `localStorage` + context | Wallet/public address from OTP metadata |
| `userMetadata` | `localStorage` + context | Object returned by validate-otp (typed loosely as `any`) |

`AuthService` (`services/auth-service.ts`) reads/writes `didToken` and builds `Authorization: Bearer …` headers. Axios interceptor clears token and redirects to `/` on HTTP 401.

`isAuthenticated` = `Boolean(userMetadata && didToken)` — **not** Privy `authenticated`.

### Does login currently work?

**Not verified end-to-end** in this environment (no Magic/Privy/API secrets).  
Structurally the user Magic flow looks complete; house login does not. Privy is only wired for proof wallet connect.

**Team note:** auth approach for Lisbon is still undecided (“wait”) — do not replace auth in this audit pass.

---

## 8. Profile flow

### What exists

- No dedicated `/profile` or `/passport` route.
- Closest “identity home”: `/home-user` (CTAs to Proofs + Journeys) + menu (`MenuUserHeader`).
- Stored identity fields observed in code paths:
  - `email` (from Magic / metadata usage in cancel flow)
  - `publicAddress`
  - `didToken`
  - opaque `userMetadata` from backend OTP validation

### Public route?

**No.** Menu links to `/about`, which **does not exist**. No shareable passport URL found.

### Wallet-address based?

Partially: proofs and journeys use `publicAddress` / `creatorAddress`. Login starts from email via Magic; address appears to come from backend metadata after OTP validation (backend behaviour not inspected here).

### Reuse for Nomadic Passport?

**Yes, as a base — with product work:**

- Reuse: session model, proofs list UI, wallet verification pattern, address-centric identity.
- Missing for Lisbon Passport: explicit passport entity/UI, public share route, ENS display/lookup, credential claim + anti-duplicate story, clearer “profile” fields.

Team intent: Passport should be “the same” conceptual surface as current identity/proofs — evolve, don’t invent a parallel system.

---

## 9. Journey flow

### What a Journey is (from `interfaces/Journey.tsx`)

A hosted opportunity/stay with:

- title, location, description, photo  
- guest capacity, **budget** (USDC in UI copy)  
- start/end dates  
- status: `PENDING | CONFIRMED | FINISHED | CANCELLED`  
- `requiredProofs` / `customProofs` (`ProofNameEnum[]`)  
- optional question  
- `creatorAddress`

### Create / store / display

| Step | UI | Persistence |
| --- | --- | --- |
| Create form | `/journey-create` → `JourneyCreate` | Local form state; preview via query/`localStorage` patterns |
| Preview/confirm | `/journey-preview` → `JourneyPreview` | POST `/api/auth/create-journey` or update-edit |
| Own list | `HackerJourneyList` on `/hacker-journeys` | POST `/api/auth/get-hacker-journeys` |
| Discover others | `AvailableJourneys` | POST `/api/auth/get-all-journeys` (filters CONFIRMED, not mine) |
| Detail | `/house-detail?journey=…` | Journey JSON passed in query string |
| Edit | `/journey-edit` | PUT via `/api/auth/update-journey-edit` |
| Cancel | `CancelJourney` | Re-auth Magic OTP UI + POST `/api/auth/update-journey` status CANCELLED |
| Apply | `/journey-apply` | **Does not call backend** — `console.log` + redirect success |
| Success | `/journey-success` | Fetches journey via `/api/auth/get-journey` when id present |

### Forms / validation

- Client-side numeric filtering for budget/capacity.
- Proof selection via click cycle (optional → required → remove) in `useProofSelection`.
- Auth gate on confirm: requires `isAuthenticated`.
- Full schema validation is light; dates/required fields UX incomplete vs a production form.

### Needed for Lisbon demo?

**Probably not core** if Lisbon focuses on Passport + claim credential.  
Journeys are the richest existing product surface and may still demo “participation history,” but they add complexity (budgets, house dual-login, apply incompleteness). Classify as **B/C** depending on demo story (see §17).

---

## 10. Proof flow

### Concept (technical + product)

Technically, a **Proof** is an enum-typed credential/check:

```text
APE_HOLDER | BAYC_NFT | ETHGLOBAL_HACKER | ETHGLOBAL_VOLUNTEER |
PATRICIO_POAP | NOUNS_NFT | TALENT_PROTOCOL_PASSPORT | WORLD_ID_POH
```

UI also references **`X-ACCOUNT`** in verification mapping, though it is **not** in `ProofNameEnum`.

Conceptually in this app:

1. **Eligibility badges** required/optional on Journeys.  
2. **User-owned verified items** listed on `/user-proofs`, generated by calling backend checkers with a wallet.

Team intent for Lisbon: treat Proof ≈ Credential in product language **without renaming code yet**.

### How proofs are created / claimed

1. Load list: POST `/api/auth/get-proof-hacker-list` → renders cards (`isActive`, icon, name…).  
2. User taps proof → dialog → **Privy `login()`** to obtain wallet.  
3. `processProof(wallet, didToken)` POSTs to type-specific BFF routes.  
4. Result dialog shows Generated / Not Found from `response.data.proof`.

This is closer to **“verify & generate against wallet”** than a separate claim mint with uniqueness guarantees.

### Attached to user/profile?

Tied to authenticated session + wallet address used at verify time. Persistence of active proofs is assumed backend-side (`get-proof-hacker-list`); frontend does not store a local proofs DB.

### Duplicate claim prevention?

**No frontend logic** found for “one real person / one credential.” No Sozu. World appears as `WORLD_ID_POH` messaging/icon and journey filter option, but **`WORLD_ID_POH` is not in the `processProof` endpoint map**, so the current verify path does not call a World checker from this frontend.

### Suitable for Lisbon credentials?

**Partially — good skeleton:**

- Enum + list UI + per-type verify endpoints + icons including World/ETHGlobal.  
- Needs: claim semantics, server-side uniqueness (Selfie Check), public passport display, possibly ENS identity binding.  
- Gaps/bugs: missing `/api/auth/get-x-account` route; World not wired in `processProof`; BAYC UI calls `get-azuki` backend path (naming mismatch risk).

---

## 11. Hacker-house functionality

| Piece | State |
| --- | --- |
| House login | Fake (link bypass) |
| House home list | **Hardcoded mock** houses in `HackerHouseList.tsx` |
| “Create Hacker House” button | Navigates to **`/user-proofs`** (wrong target) |
| House detail | Reuses Journey object in query params; participants are **mock** |
| Connection to Journeys | Strong conceptual overlap — house detail is journey-centric |
| Connection to Proofs | Participants show proof-like verification icons (mock) |

**Complete enough to reuse for Lisbon?** UI patterns and imagery maybe; **not** as a real community/house backend feature. Prefer **B or D** for demo scope.

---

## 12. Backend dependency map

All BFF routes live under `app/api/auth/*` and require `didToken` in the JSON body (except they ignore unused fields sometimes). They forward `Authorization: Bearer ${didToken}` to `NEXT_PUBLIC_NOMADIC_API_URL + <path>`.

| Frontend method | Frontend endpoint | Calling file(s) | Backend path (appended) | Body (frontend → BFF) | Auth | Expected response (as used) | Error handling | Essential for Lisbon Passport? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/auth/validate-otp` | `LoginUser.tsx` | `/validaOTP` | `{ email, didToken }` | Bearer DID | `{ metadata }` incl. `publicAddress` | status passthrough / 500 | **Yes** (current login) |
| POST | `/api/auth/get-proof-hacker-list` | `UserProofs.tsx` | `/get-proof-hacker-list` | `{ publicAddress, didToken }` | Bearer; backend call is **GET** | proof array | status / 500 | **Yes** |
| POST | `/api/auth/get-poaps` | `UserProofs.tsx` | `/poaps?wallet=` | `{ wallet, didToken }` | Bearer GET | `{ proof }` | status / 500 | Maybe (demo credential types) |
| POST | `/api/auth/get-talent` | `UserProofs.tsx` | `/talent?wallet=` | same | Bearer GET | `{ proof }` | status / 500 | Maybe |
| POST | `/api/auth/get-nouns` | `UserProofs.tsx` | `/nouns?wallet=` | same | Bearer GET | `{ proof }` | status / 500 | Maybe |
| POST | `/api/auth/get-ape` | `UserProofs.tsx` | `/check_ape?wallet=` | same | Bearer GET | `{ proof }` | status / 500 | Maybe |
| POST | `/api/auth/get-azuki` | `UserProofs.tsx` (mapped from `BAYC_NFT`) | `/azuki?wallet=` | same | Bearer GET | `{ proof }` | status / 500 | Unclear (naming mismatch) |
| POST | `/api/auth/get-builder` | `UserProofs.tsx` (`ETHGLOBAL_HACKER`) | `/builder?wallet=` | same | Bearer GET | `{ proof }` | status / 500 | Maybe (ETHGlobal signal) |
| POST | `/api/auth/get-x-account` | `UserProofs.tsx` | **No BFF route in repo** | `{ wallet, didToken }` | — | — | client catch | Broken |
| POST | `/api/auth/create-journey` | `JourneyPreview.tsx` | `/create-journey` | `{ journey, didToken, publicAddress }` | Bearer POST | `{ journey }` | status / 500 | No (unless journeys in demo) |
| POST | `/api/auth/update-journey-edit` | `JourneyPreview.tsx` | `/update-journey` **PUT** | `{ journey, didToken, publicAddress }` | Bearer | data | status / 500 | No |
| POST | `/api/auth/update-journey` | `CancelJourney.tsx` | `/update-journey-status` | `{ journeyId, status, didToken }` | Bearer POST | data | status / 500 | No |
| POST | `/api/auth/get-all-journeys` | `AvailableJourneys.tsx` | `/get-all-journeys` **GET** | `{ publicAddress, didToken }` | Bearer | `{ journeys }` | status / 500 | No |
| POST | `/api/auth/get-hacker-journeys` | `HackerJourneyList.tsx` | `/get-hacker-journeys` **GET** | `{ publicAddress, didToken }` | Bearer | `{ journeys }` | status / 500 | No |
| POST | `/api/auth/get-journey` | `JourneySuccessClient.tsx` | `/get-journey` | `{ journeyId, didToken, publicAddress }` | Bearer POST | journey payload | status / 500 | No |

**Not invented:** exact backend schemas, DB models, or whether responses match frontend assumptions — requires `nomadic-back` inspection.

**Dead / incomplete:** `app/api/auth/[...route]/route.ts` defines `validateAuthToken` only; no `GET`/`POST` export observed.

---

## 13. Working features

Evidence = code path complete + route loads in smoke test; **not** claiming live provider/backend success.

| Feature | Evidence |
| --- | --- |
| Landing → login CTAs | `Landing.tsx`, `/` returns 200 |
| User login UI + Magic OTP wiring | `LoginUser.tsx` full flow coded |
| Session persistence helpers | `UserContext`, `AuthService` |
| Nomad home navigation | `HomeUser.tsx` → proofs/journeys |
| Proofs page shell + search UI | `UserProofs.tsx`, `/user-proofs` 200 |
| Journey create/edit/preview UI | substantial forms + proof selector |
| Journey list/discover UI wired to API proxies | `HackerJourneyList`, `AvailableJourneys` |
| BFF proxy layer for OTP/proofs/journeys | `app/api/auth/*` |
| Design system primitives | `components/ui/*`, Satoshi branding |
| Dev server + production build (post-fix) | commands in §4–5 |

---

## 14. Partially implemented features

| Feature | What’s missing / incomplete |
| --- | --- |
| Privy wallet verify for proofs | Needs valid Privy app id; World/X types incomplete |
| Journey apply | No API write; success is cosmetic |
| House detail apply button | `console.log("Apply to Journey")` |
| Cancel journey | Complex Magic re-OTP + code modal; fragile |
| House login / house create | Bypass / wrong navigation target |
| Menu items | `$NACC`, single-use ID commented; `/about` missing |
| Proof enum vs UI | `X-ACCOUNT`, volunteer, World inconsistencies |
| Auth dual-stack | Magic session + Privy ephemeral wallet poorly documented |
| QueryClient in layout | `new QueryClient()` inside render — unstable client instance |

---

## 15. Broken features / blockers

| Issue | Category | Blocks demo? |
| --- | --- | --- |
| No env secrets in audit env | config | **Yes** for real login/API |
| Privy empty app id crashed production build (fixed minimally) | build | Was yes; mitigated |
| `/api/auth/get-x-account` referenced but missing | missing route | X proof path |
| House login unauthenticated | incomplete | House demo path |
| Create Hacker House → `/user-proofs` | wrong link | House create |
| TypeScript errors under `tsc` | types | Soft (Next ignores) |
| `zod` imported in app code but only transitive via Privy | dependency hygiene | Soft risk |
| Catch-all auth route incomplete | dead code | No |
| TLS verification disabled in Next experimental env | security | Deploy risk |

---

## 16. Dead or duplicate code

| Item | Notes |
| --- | --- |
| `app/api/auth/[...route]/route.ts` | Auth helper only; unused as HTTP handler |
| Commented OTP digit UI in `LoginUser` | Dead UI |
| Commented modals in `HomeUser` | Dead |
| Commented menu entries (NACC, single-use ID, recommend, reviews) | Intentionally hidden |
| `LogoutButton.tsx` | Exists; logout also implemented in menu headers |
| Mock house list vs journey-backed house detail | Parallel concepts |
| Inter font loaded unused | Minor dead import |
| `public/**/Thumbs.db` | Noise artifacts |
| Duplicate `typescript.ignoreBuildErrors` in `next.config.mjs` | Config duplication |

---

## 17. Reuse classification

| Module / feature | Class | Evidence |
| --- | --- | --- |
| App shell, routing, Satoshi/brand UI | **A** | Working pages; on-brand |
| Magic login + UserContext session | **A / C** | Complete code path; live success unverified → treat as A-intended, C until backend/Magic confirmed |
| Proofs list + verify UX | **A** | Directly maps to Passport credentials surface |
| Proof enum + icons (incl. World/ETHGlobal) | **A** | Reusable vocabulary for Lisbon credentials |
| World Selfie Check uniqueness | **E** | Concept present (`WORLD_ID_POH`); implementation not claim/anti-dupe; needs careful replacement/extension |
| ENS identity | **E** (new) | Not present; planned primary integration |
| Journey create/list/API | **B** | Valuable later; distracts from Passport-first demo |
| Journey apply / participants | **C / D** | Incomplete/mock |
| Hacker house mocks + house login | **D** (demo) / **B** (keep code) | Not demo-ready; don’t delete history |
| `$NACC` tokens UI | **D** | Hardcoded mock finance UI |
| Generate single-use ID | **D** | Local mock (`1234567890`) |
| Search on proofs | **B** | Fine to keep; not core story |
| Budgets on journeys | **B / D** | Part of journeys; not passport-core |
| X/Twitter proof | **C** | UI exists; API route missing |
| Sozu | **D** | Not found |
| Expense sharing / notifications / settings | **D** | Not found as real features |
| Axios auth interceptor + BFF pattern | **A** | Keep; extend for new credential endpoints |
| Public passport route | **E** (new) | Missing; must add carefully inside this app |

Legend: **A** Lisbon retain · **B** keep but hide · **C** repair before decide · **D** exclude Lisbon · **E** replace carefully / add carefully.

---

## 18. Main technical risks

1. **Dual auth mental model** (Magic DID vs Privy wallet) is easy to break and hard to demo cleanly.  
2. **Backend coupling** — frontend assumes specific paths (`/validaOTP`, `/check_ape`, etc.) without typed contracts.  
3. **Build ignores type/lint errors** — regressions can ship unnoticed.  
4. **Secrets required for any real demo**; empty Privy previously broke static generation.  
5. **Query string passing of full Journey JSON** — brittle, size-limited, poor security posture.  
6. **No automated tests**.  
7. **TLS reject unauthorized** experimental flag.  
8. **Proof naming mismatches** (BAYC→azuki, missing X route, World unwired).  
9. **Continuity honesty** — large pre-existing surface must not be presented as Lisbon-built.

---

## 19. Questions that require backend inspection (`nomadic-back`)

1. What does `/validaOTP` create/return in `metadata`? Is a user/profile row persisted?  
2. How are proofs stored after verify? Per wallet? Per Magic user? Can they be listed publicly?  
3. Is there any uniqueness / World ID / nullifier / personhood binding today?  
4. Exact schemas for journey create/update/list and whether apply endpoints exist (frontend doesn’t call any).  
5. Why BAYC maps to `/azuki` — intentional or bug?  
6. Does `/get-proof-hacker-list` ignore `publicAddress` (BFF sends GET without query)?  
7. Auth: is Magic DID validated server-side? Bearer format expectations?  
8. Any ENS, public profile, or passport endpoints already?  
9. Confirm this frontend’s `NEXT_PUBLIC_NOMADIC_API_URL` target is indeed this backend.  
10. World / Selfie Check verification endpoints — existing vs new.

---

## 20. Recommendation

### Option 1 — Evolve this frontend (**recommended**)

**Benefit:** Keeps working UI, proof vocabulary, journey domain, BFF pattern, brand, and git continuity for ETHGlobal continuity judging.  
**Cost:** Must navigate dual auth, incomplete house/apply paths, and type debt; requires discipline to hide non-demo routes.

### Option 2 — Partially rebuild inside this repository

**Benefit:** Can reshape Passport/public route/ENS/World claim flow without fighting every old journey screen.  
**Cost:** Higher churn; risk of breaking still-useful proof/login code; more review load for a solo designer+AI workflow.

### Option 3 — Clean new app

**Benefit:** Clean architecture.  
**Cost:** Throws away substantial UI/domain work; weakens continuity narrative; slowest path for a one-person hackathon. **Not justified** merely because code is untidy.

**Decision:** **Evolve this frontend**, hide non-essential surfaces (houses mocks, NACC, single-use ID, heavy journey apply), and add Lisbon Passport/ENS/World claim pieces incrementally on `lisboa2026`.

---

## Minimal audit fixes

Only changes made to unblock build/inspection:

| File | Change | Why |
| --- | --- | --- |
| `app/layout.tsx` | Mount `PrivyProvider` only when `NEXT_PUBLIC_PRIVY_APP_ID` is non-empty | Empty app id crashed prerender of all pages |
| `app/user-proofs/page.tsx` | Load `UserProofs` via `next/dynamic` with `ssr: false` | Privy hooks would crash without provider during SSR |

**Not changed:** package versions, auth providers, renames, feature deletions, ENS/World/Walrus integrations.

**Runtime note:** `/user-proofs` wallet verification still **requires** a real Privy app id at runtime; without it, Privy hooks may fail client-side even though the shell route returns 200.

---

## Audit report card (quick)

| Area | Status |
| --- | --- |
| Install | OK (`npm ci`) |
| Dev server | OK (smoke 200s) |
| Lint | OK (warnings) |
| `tsc` | Fail (known errors) |
| Production build | OK after minimal fix |
| Tests | None |
| Live Magic/Privy/API | Unverified / blocked without env |

---

## Suggested next investigation

1. Audit **`nomadic-back`**: models for users/proofs/journeys; OTP; proof persistence; any personhood fields.  
2. With real env values (locally, not committed): exercise Magic login + one proof verify + one journey create.  
3. Draft Lisbon MVP map: which existing screens become Passport vs stay hidden.  
4. Spike ENS resolve/display on top of `publicAddress` without replacing Magic yet (per “auth wait”).  
5. Confirm World Selfie Check Beta API vs current `WORLD_ID_POH` assumptions.

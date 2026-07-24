# Lisbon Implementation Plan — ETHGlobal Lisbon 2026

> Solo-developer plan. Incremental. No new app. No monorepo.  
> Product: [`LISBON_MVP.md`](./LISBON_MVP.md) · Architecture: [`LISBON_ARCHITECTURE.md`](./LISBON_ARCHITECTURE.md) · Routes: [`LISBON_ROUTES.md`](./LISBON_ROUTES.md).

---

## Principles

- Prefer additive backend changes; do not redesign `UserProofs` / Journey tables.
- Hide legacy demo distractions; do not delete features.
- Confirm Magic `publicAddress` stability and World beta proof shape before freezing the migration.
- **No** `DEMO_WORLD_BYPASS`. Local-only test adapters must be impossible to enable in preview/production.
- Walrus only after P0.

---

## P0 — Required (demo-blocking)

### P0.0 Documentation (this pass)

| | |
| --- | --- |
| **Repository** | `nomadic-front` |
| **Files** | `docs/LISBON_*.md`, `docs/PREEXISTING_VS_LISBON.md` |
| **Dependencies** | none |
| **Acceptance** | Five docs merged on `lisboa2026`; product decisions locked |
| **Demo fallback** | n/a |

---

### P0.1 Private Passport page shell + demo navigation

| | |
| --- | --- |
| **Repository** | `nomadic-front` |
| **Files likely** | `app/passport/page.tsx`, `components/Passport*.tsx`, `components/HomeUser.tsx`, `components/MenuUserHeader.tsx`, `components/Landing.tsx` (CTA if needed) |
| **Dependencies** | Existing Magic session (`UserContext`) |
| **Acceptance** | Authenticated user reaches `/passport` showing session identity + truncated wallet/email; primary home CTA goes to Passport; Journeys/Proofs demoted; claim CTA placeholder for **Nomadic Lisbon 2026** |
| **Demo fallback** | Static Passport layout with session fields even if API aggregate missing |

**This is the smallest first implementation task after docs are approved.**

---

### P0.2 Persist `User.publicAddress` (Magic-validated)

| | |
| --- | --- |
| **Repository** | `nomadic-back` |
| **Files likely** | Prisma `User` model, OTP/validate handler, migration |
| **Dependencies** | Confirm Magic Admin returns stable address |
| **Acceptance** | When Magic metadata includes address, it is stored on `User.publicAddress` (@unique, nullable); validate-otp response remains compatible with frontend |
| **Demo fallback** | If Magic lacks address: document `WALLET_NOT_BOUND` path; public-by-wallet deferred until reliable bind |

---

### P0.3 `CredentialClaim` model + migration

| | |
| --- | --- |
| **Repository** | `nomadic-back` |
| **Files likely** | Prisma schema, migration |
| **Dependencies** | P0.2 preferred first; World uniqueness field format may stay as generic `uniquenessKey` until beta docs confirmed |
| **Acceptance** | Table exists with `@@unique([userId, credentialKey])`, `@@unique([uniquenessKey, credentialKey])`, `@@index([walletAddress])`; **no** wallet unique constraint; no `status` field |
| **Demo fallback** | n/a (schema only) |

---

### P0.4 Claim endpoint + World server verification

| | |
| --- | --- |
| **Repository** | `nomadic-back` (+ FE BFF later) |
| **Files likely** | `POST /credentials/claim` route, World verify client module |
| **Dependencies** | P0.3; World Selfie Check Beta API access/docs |
| **Acceptance** | Allowlist `NOMADIC_LISBON_2026`; verify proof server-side; derive `uniquenessKey`; bind wallet from trusted user field; idempotent 200 for same user; 409 for uniqueness conflict; stores no selfie/biometric/full payload |
| **Demo fallback** | Return `503 WORLD_UNAVAILABLE` with honest FE state; local-only test adapter in development builds only; use recorded demo video for judging if beta blocked |

---

### P0.5 Passport aggregate endpoints

| | |
| --- | --- |
| **Repository** | `nomadic-back` |
| **Files likely** | `GET /passport/me`, `GET /passport/public/:identifier` |
| **Dependencies** | P0.2–P0.4 (claims may be empty initially) |
| **Acceptance** | Private aggregate for authed user; public aggregate by wallet after ENS/address resolution; no email on public; 404 when not found |
| **Demo fallback** | Private page can render session-only fields if aggregate fails |

---

### P0.6 Frontend BFF proxies for passport + claim

| | |
| --- | --- |
| **Repository** | `nomadic-front` |
| **Files likely** | `app/api/passport/me/route.ts`, `app/api/passport/public/[identifier]/route.ts`, `app/api/credentials/claim/route.ts` |
| **Dependencies** | P0.4–P0.5 |
| **Acceptance** | Forwards DID; maps statuses; no secrets logged |
| **Demo fallback** | Same as upstream error mapping in `LISBON_ROUTES.md` |

---

### P0.7 ENS resolve + display

| | |
| --- | --- |
| **Repository** | `nomadic-front` |
| **Files likely** | `lib/ens.ts` (or similar), Passport components, public page |
| **Dependencies** | Bound wallet address |
| **Acceptance** | Shows ENS name + avatar when resolvable; else truncated wallet; public `/p/name.eth` resolves to wallet then loads Passport |
| **Demo fallback** | Truncated wallet only; public route still works with `0x` identifier |

---

### P0.8 Lisbon claim UI + World client flow

| | |
| --- | --- |
| **Repository** | `nomadic-front` |
| **Files likely** | `app/credentials/lisbon-2026/page.tsx`, claim components, World SDK wiring |
| **Dependencies** | P0.4, P0.6, World beta client docs |
| **Acceptance** | User can complete Selfie Check and see credential on `/passport`; second attempt idempotent UX; World down → honest unavailable (never fake success in preview/prod) |
| **Demo fallback** | Recorded successful claim demo; local-only adapter for engineers |

---

### P0.9 Public Passport page

| | |
| --- | --- |
| **Repository** | `nomadic-front` |
| **Files likely** | `app/p/[identifier]/page.tsx`, public Passport component |
| **Dependencies** | P0.5–P0.7 |
| **Acceptance** | Unauthenticated visitor sees wallet/ENS + Nomadic Lisbon 2026 credential; 404 state works |
| **Demo fallback** | Share by raw address if ENS lookup fails |

---

### P0.10 Demo script + continuity check

| | |
| --- | --- |
| **Repository** | `nomadic-front` (docs) |
| **Files likely** | Update `PREEXISTING_VS_LISBON.md` checklist; short `docs/LISBON_DEMO_SCRIPT.md` if needed |
| **Dependencies** | P0.1–P0.9 |
| **Acceptance** | Written walkthrough matching success criteria in MVP doc |
| **Demo fallback** | Script includes ENS-down and World-down honest paths |

---

## P1 — Polish

| ID | Task | Repo | Acceptance | Fallback |
| --- | --- | --- | --- | --- |
| P1.1 | Share button / copy public URL | front | One-tap copy of `/p/...` | Manual URL |
| P1.2 | Empty / loading / error states on Passport | front | Clear UX for unbound wallet, no claims | Minimal text |
| P1.3 | Collapse legacy proofs secondary section | front | Lisbon credential remains primary | Hide legacy entirely |
| P1.4 | Tighten TypeScript on **new** Lisbon files only | front/back | New code typechecks without ignoring errors | Leave legacy ignores |
| P1.5 | Idempotent claim copy (“Already on your Passport”) | front | Distinct from hard 409 | Generic toast |

---

## P2 — Optional (after P0)

| ID | Task | Notes |
| --- | --- | --- |
| P2.1 | Walrus metadata pin for passport/credential metadata | Only if P0 complete and adds demo value |
| P2.2 | Public journey history | Only if a safe public journey read exists |
| P2.3 | Additional community credentials with real evidence | e.g. organizer-issued `ETHGLOBAL_LISBON_2026_PARTICIPANT` |
| P2.4 | Wallet ownership signature binding | Enables stronger wallet constraints later |

---

## Explicitly deferred

- New app / monorepo / clean rewrite.
- Passport DB entity.
- Renaming `UserProofs` / Proof enums / Journey models.
- Deleting houses, journeys, NACC, legacy verify UI.
- Multi-wallet account management.
- Social graph, reviews, reputation scores.
- `@@unique([walletAddress, credentialKey])` before ownership proof.
- Deployable World claim bypasses.
- Storing World full payloads / biometrics / selfies.

---

## Suggested build order (solo)

```text
P0.0 docs (done in this PR)
→ P0.1 /passport shell + nav   ← first code task
→ P0.2 User.publicAddress
→ P0.3 CredentialClaim migration
→ P0.5 passport read APIs (even with empty claims)
→ P0.6 BFF + wire /passport to API
→ P0.7 ENS
→ P0.4 + P0.8 World claim (may proceed in parallel once schema exists)
→ P0.9 public /p/[identifier]
→ P0.10 demo script
→ P1 polish
```

---

## Smallest first implementation task

After architecture/routes review approval:

**Implement `/passport` shell in `nomadic-front` (P0.1)** — session identity, truncated wallet, Nomadic Lisbon 2026 placeholder CTA, home/menu primary path to Passport, legacy CTAs demoted. No ENS/World/schema in that first PR slice.

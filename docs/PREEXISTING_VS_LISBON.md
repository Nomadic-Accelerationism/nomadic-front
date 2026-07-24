# Pre-existing vs Lisbon work — Continuity statement

> For ETHGlobal Lisbon 2026 judging and internal honesty.  
> Nomadic is a **continuity project**: substantial work existed before Lisbon.  
> This document separates what was already built from what Lisbon adds.

Related: [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md), [`FRONTEND_AUDIT.md`](./FRONTEND_AUDIT.md), [`LISBON_MVP.md`](./LISBON_MVP.md).

---

## 1. How to read this

| Label | Meaning |
| --- | --- |
| **Pre-existing** | Built before Lisbon; may be reused, hidden, or left untouched |
| **Lisbon** | New work on branch `lisboa2026` (and matching backend commits) for this hackathon |
| **Out of Lisbon credit** | Must not be presented as built during Lisbon |

Do not delete pre-existing features to “look cleaner.” Hide them from the demo path instead.

---

## 2. Pre-existing

### Authentication and users

- Magic email OTP login (frontend `LoginUser`, Magic SDK).
- Magic DID Bearer validation on the backend.
- Users persisted by **email**.
- Session storage pattern (`didToken`, `userMetadata`, `publicAddress` in frontend context/localStorage).
- Existing OTP BFF proxy (`/api/auth/validate-otp` → `/validaOTP`).
- Wallet not yet a confirmed first-class persisted `User` field (Lisbon proposes this only after a Magic metadata spike).

### Journeys

- Journey domain model and statuses.
- Create / edit / preview / list / cancel flows and related BFF proxies.
- Budget, capacity, required proofs on journeys.

### Proofs (legacy)

- `Proof` / `ProofNameEnum` terminology in frontend.
- `UserProofs` storage and list/verify UX (`/user-proofs`).
- Legacy wallet checks (POAP, Nouns, Ape, Talent, builder/ETHGlobal signals, etc.).
- Privy usage for ephemeral wallet connect during legacy proof verification.
- Historical `WORLD_ID_POH` naming/assets (not a working Selfie Check claim pipeline).

### Frontend shell

- Next.js 14 App Router app (`nomadic-front`).
- Landing, home-user, menus, Satoshi branding, shadcn/Radix UI kit.
- Axios + React Query patterns; `app/api/auth/*` BFF proxies.
- Transitive `viem` via Privy (currently lockfile `2.23.2`); no ENSjs yet.

### Other pre-existing surfaces (often incomplete or mock)

- Hacker house login/list/detail (largely mock / incomplete).
- `$NACC` tokens UI (mock).
- Generate single-use ID UI (mock).
- Journey apply paths that do not fully persist.

### Backend platform (pre-Lisbon)

- Express + TypeScript + Prisma + PostgreSQL.
- Existing proof and journey endpoints/tables.
- No Passport entity; no public Passport endpoint; no ENS resolution; no working World verification / RP signing; no uniqueness store; `UserProofs` allows duplicates.

---

## 3. Lisbon work

### Product / UX

- Nomadic **Passport** as an aggregated product view (not a new Passport table).
- Private route `/passport`.
- Public route `/p/[identifier]` (frontend ENS alias → wallet; Express by address only).
- Demo navigation that promotes Passport and demotes legacy CTAs (without deleting routes).
- User-facing **Credential** language for Lisbon UI while keeping internal `Proof` names.
- Public-disclosure requirement before claim completion.

### Identity (ENS)

- **ENSv2-ready application integration** using ENSjs + viem + canonical Universal Resolver.
- No direct dependency on draft ENSv2 registry/registrar contracts in P0.
- Wallet-canonical identity; ENS as alias with reverse+forward verification and avatar.
- ENS data not persisted in Nomadic DB for P0.
- Express never resolves ENS in P0.

### Credentials and uniqueness

- Primary credential:

```text
NOMADIC_LISBON_2026
Nomadic Lisbon 2026
A World Selfie Check–verified credential claimed through Nomadic during ETHGlobal Lisbon 2026.
```

- New `CredentialClaim` table (after World spike; not forced into `UserProofs`).
- World RP signing (`POST /world/request`) + IDKit client + server verify + claim.
- Uniqueness: same verified World identity cannot create a second claim for the same credential action; one Nomadic user per credential key.
- Constraints: `userId+credentialKey`, `uniquenessKey+credentialKey`; no wallet unique until ownership proven.
- Honest naming: does **not** claim ETHGlobal attendance or absolute global unique-personhood beyond World’s verified action model.

### Public profile

- Unauthenticated public Passport read by **wallet address**.
- Public fields only (no email); credentials list; optional secondary legacy proofs.
- Not discoverable by email.

### Documentation and process

- `PROJECT_CONTEXT.md`, `FRONTEND_AUDIT.md`.
- `LISBON_MVP.md`, `LISBON_ARCHITECTURE.md`, `LISBON_ROUTES.md`, `LISBON_IMPLEMENTATION_PLAN.md`, this file.
- ENS readiness tests and Magic/World spikes in the implementation plan.
- Continuity-aware PR/branch practice (`lisboa2026`).

### Explicitly not Lisbon (yet) / deferred

- Walrus / Sui (after P0 only).
- Direct experimental ENSv2 contract integration (P2 / deferred).
- Organizer-issued credentials such as `ETHGLOBAL_LISBON_2026_PARTICIPANT`.
- Journey history on the public Passport.
- Social graph, reviews, reputation scores.

---

## 4. Side-by-side summary

| Area | Pre-existing | Lisbon |
| --- | --- | --- |
| Login | Magic email DID | Keep; do not replace |
| User key | Email | Email + proposed `publicAddress` after Magic spike |
| Human-readable ID | Mostly raw address / email | Verified ENS alias via Universal Resolver |
| Passport | None | `/passport` + `/p/[identifier]` |
| ENS in backend | None | Still none in P0 (FE only) |
| Credential uniqueness | None (`UserProofs` duplicates possible) | `CredentialClaim` + World action-scoped uniqueness |
| World | Icon / `WORLD_ID_POH` legacy naming | RP sign + Selfie Check verify + claim |
| Journeys | Full-ish product surface | Hidden from demo path; not public P0 |
| Houses / NACC / single-use | Present / mock | Hidden from demo path |
| Walrus / direct ENSv2 contracts | None | Deferred post-P0 |
| Docs | Boilerplate README | Lisbon MVP + audit + continuity docs |

---

## 5. What judges should not credit as Lisbon-built

- Magic authentication itself.
- Journey creation and management.
- Legacy NFT/social proof verification UI and endpoints.
- Existing visual shell, menus, and branding system (Lisbon **reuses** them).
- Prior hackathon scaffolding that this continuity project inherits.

Judges **should** credit Lisbon for: Passport productization; ENSv2-ready resolution/identity aliasing; public share route; World Selfie Check claim flow for **Nomadic Lisbon 2026** with server RP signing and uniqueness persistence; and honest continuity documentation.

---

## 6. Demo path vs legacy path

**Demo path (Lisbon):**

```text
Landing → Magic login → /passport → disclose public fields → claim Nomadic Lisbon 2026 → share /p/[identifier]
```

**Legacy path (pre-existing, still in repo):**

```text
/home-user → /user-proofs | /hacker-journeys → journey/house flows
```

Legacy remains reachable for continuity and future work; it is not the primary Lisbon narrative.

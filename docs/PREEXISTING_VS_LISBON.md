# Pre-existing vs Lisbon work — Continuity statement

> ETHGlobal Lisbon 2026 continuity honesty.  
> North star: [`PRODUCT_VISION.md`](./PRODUCT_VISION.md) · Slice: [`LISBON_MVP.md`](./LISBON_MVP.md)

Nomadic is a **continuity project**. Substantial work existed before Lisbon. This file separates inheritance from Lisbon-built work.

---

## 1. Labels

| Label | Meaning |
| --- | --- |
| **Pre-existing** | Before Lisbon; reused, hidden, or left untouched |
| **Lisbon** | `lisboa2026` (+ matching backend) for this hackathon |
| **Out of Lisbon credit** | Must not be presented as built during Lisbon |

Do not delete pre-existing features to look cleaner — hide them from the demo path.

---

## 2. Pre-existing

### Auth and users

- Magic email OTP; DID Bearer validation; users by email.
- Frontend session (`didToken`, `userMetadata`, `publicAddress` in context/localStorage).
- OTP BFF → `/validaOTP`.

### Journeys (legacy product surface)

- Journey model, statuses, create/edit/preview/list/cancel, budgets, `requiredProofs`.
- Existing journey/house UI scaffolding.

Judges must **not** treat legacy Journey CRUD as the Lisbon eligibility story.

### Proofs (legacy)

- `Proof` / `UserProofs`, NFT/social verify UI, Privy-for-wallet-verify, historical `WORLD_ID_POH` naming.

### Frontend shell

- Next.js 14 app, branding, menus, Axios/React Query, `app/api/auth/*` proxies.
- Transitive `viem` via Privy; no ENSjs yet (until P0.6).

### Backend platform

- Express + TS + Prisma + PostgreSQL.
- No Passport entity; no public Passport; no ENS; no working World Identity/Selfie claim pipeline; no uniqueness store; `UserProofs` allows duplicates; wallet not confirmed first-class on User.

### Other

- House login/list mocks, `$NACC`, single-use ID mocks, incomplete apply paths.

---

## 3. Lisbon work

### Product / docs

- [`PRODUCT_VISION.md`](./PRODUCT_VISION.md) — five entities; World/ENS roles; anti-patterns.
- Journey-centered Lisbon MVP/architecture/routes/plan (this revision).
- Continuity docs and demo scripting.

### Passport UX

- Private `/passport` shell + demo nav (**P0.1 implemented**).
- Public `/p/[identifier]` (planned).
- Passport as aggregated view (no Passport table).

### Journey-centered eligibility demo

- Seeded **Nomadic Lisbon House** Journey + **lisbon_house_policy_v1** presentation.
- Transparent disclosure (what is proven / not received).
- Application lifecycle linked to policy version.

### World

- **Identity Check** = private policy eligibility.
- **Selfie Check** = continuity / one apply per verified identity for Journey action.
- Server RP signing + verify; minimal attestations; no document PII storage.
- Credential: `NOMADIC_LISBON_HOUSE_ELIGIBLE` / **Nomadic Lisbon House — Eligible**  
  (supersedes earlier standalone `NOMADIC_LISBON_2026` as primary P0 story).

### ENS

- ENSv2-ready application resolution (ENSjs + Universal Resolver).
- Wallet-canonical; Express address-only.
- Subnames / issuer delegation documented as later stages — not P0 mint CTAs.

### Data

- Additive `CredentialClaim`, `JourneyApplication` (planned).
- Proposed `User.publicAddress` after Magic spike.

### Explicitly not Lisbon-built / deferred

- Legacy Journey CRUD itself.
- Walrus; direct ENSv2 registry experiments.
- Full multi-community CMS.
- Organizer-issued “ETHGlobal Participant” without evidence.

---

## 4. Side-by-side

| Area | Pre-existing | Lisbon |
| --- | --- | --- |
| Product story | Proofs + journeys scaffolding | Journey → policy → private verify → credential → Passport |
| Login | Magic | Keep |
| Passport | None | Shell done; APIs/public/ENS planned |
| Policy | Flat `requiredProofs` | Versioned eligibility policy (seeded) |
| World | Icon / legacy enum | Identity Check + Selfie Check roles |
| ENS | None | Resolve/display P0; subnames later |
| Credentials | UserProofs duplicates possible | CredentialClaim uniqueness |
| Demo nav | Proofs/Journeys primary | Passport + Lisbon House Journey primary |

---

## 5. What judges should not credit as Lisbon-built

- Magic authentication.
- Pre-existing Journey create/list/edit machinery.
- Legacy NFT/social proof verification.
- Existing shell/branding (Lisbon **reuses** them).
- Prior hackathon scaffolding.

**Credit Lisbon for:** product vision clarity; Journey-centered eligibility demo; World Identity vs Selfie roles with data minimization; portable Lisbon House credential; ENSv2-ready Passport identity aliasing; public share; continuity documentation; Passport shell already on branch.

---

## 6. Demo path vs legacy path

**Lisbon demo path:**

```text
Login → Passport → Nomadic Lisbon House Journey → policy disclosure
→ Identity Check → Selfie Check → application → credential on Passport
→ share /p/[identifier]
```

**Legacy path (still in repo):**

```text
/home-user → /user-proofs | legacy /hacker-journeys CRUD → house mocks
```

Legacy remains for continuity; it is not the Lisbon narrative.

# Lisbon MVP — ETHGlobal Lisbon 2026

> Status: **hackathon product slice** (documentation).  
> North star: [`PRODUCT_VISION.md`](./PRODUCT_VISION.md)  
> Also: [`FRONTEND_AUDIT.md`](./FRONTEND_AUDIT.md), [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md)  
> Branch: `lisboa2026`  
> **Supersedes** the earlier Passport-only / Selfie-only-claim framing of Lisbon P0.

Nomadic must remain a portable community passport — **not** a World KYC app or an ENS minting demo.

---

## 1. What we are shipping

A Journey-first demo of Nomadic:

1. User signs in with existing **Magic** auth and opens their **Passport** (shell already exists — P0.1).
2. User discovers the seeded **Nomadic Lisbon House** Journey.
3. User reviews a transparent **Eligibility Policy**.
4. User completes **World Identity Check** (private policy attributes) and **World Selfie Check** (continuity).
5. User submits a Journey **application**.
6. Nomadic attaches a portable credential: **Nomadic Lisbon House — Eligible**.
7. Credential appears on the Passport; user can share a **public Passport** URL.

```text
Discover a place
→ understand its community
→ apply privately
→ (participate)
→ carry the experience forward on the Passport
```

**Continuity note:** Earlier Lisbon drafts centered on a standalone `NOMADIC_LISBON_2026` Selfie-only claim. That is **no longer the main P0 story**. The primary credential is journey/policy scoped: `NOMADIC_LISBON_HOUSE_ELIGIBLE`.

---

## 2. Five product blocks (Lisbon slice)

Aligned with [`PRODUCT_VISION.md`](./PRODUCT_VISION.md):

### 2.1 Passport

Aggregated view — **not** a DB entity.

- Routes: `/passport` (private), `/p/[identifier]` (public).
- Shows wallet (canonical), ENS alias when resolved, credentials, later journeys/communities.
- **P0.1 complete** in frontend: shell + demo nav using Magic `UserContext` (no ENS/World/API yet).

### 2.2 Community

P0 seed: **Nomadic Lisbon House** (not a full community CMS).

### 2.3 Journey

P0 seed: **Lisbon Hacker House** temporary opportunity (dates, capacity, description, apply).  
Reuse existing Journey UI concepts; do not delete legacy journey code.

### 2.4 Eligibility Policy

P0: `lisbon_house_policy_v1` presented on the Journey.

Intended required attributes (product intent):

- 18 or older;
- eligible jurisdiction;
- unique verified document;
- optional: prior Nomadic / hacker / ETHGlobal-style credentials when available.

**Implementation gated** on the World Identity Check capability spike. Docs and UI must mark attributes as **confirmed** vs **aspirational** after the spike — do not fake attribute results.

### 2.5 Credential

```text
credentialKey:  NOMADIC_LISBON_HOUSE_ELIGIBLE
displayName:    Nomadic Lisbon House — Eligible
description:    Eligibility credential for Nomadic Lisbon House after privately
                satisfying Lisbon House Policy v1 during ETHGlobal Lisbon 2026.
```

Not “ETHGlobal Participant” without organizer evidence.

---

## 3. World and ENS roles (Lisbon)

### World

| Check | Job in Nomadic |
| --- | --- |
| **Identity Check** | Private eligibility for policy attributes → `policySatisfied` bits only |
| **Selfie Check** | Continuity / one application per verified identity for this Journey action |

Selfie allowlisted action (example): `apply_lisbon_house_v1`.

Nomadic does **not** store legal name, document numbers, selfies, or full World payloads.

### ENS (Sepolia ENSv2 — locked)

| Stage | Lisbon |
| --- | --- |
| Programmatic Passport mint `*.nomadic-passport.eth` | **P0** (Sepolia) |
| Primary name + forward/reverse verify | **P0** |
| Active text records driving UI | **P0** |
| Credential child after World success | **P0** |
| Scoped issuer permission + revoke demo | **P0** |
| Mainnet UR readiness (`ur.integration-tests.eth`) | **P0** (CI / library) |
| contenthash / IPFS manifest | **P1** |
| CCIP-Read dynamic reputation | **P2** |

Wallet remains the canonical **backend** key. **Product identity** is the Passport ENS name. Express stays address-keyed; FE/BFF resolve Sepolia ENS. Always show a **Sepolia / testnet** badge. Details: [ENS_SEPOLIA_V2_CYCLE.md](./ENS_SEPOLIA_V2_CYCLE.md).

---

## 4. Exact user flow (demo script)

```text
1. Magic login → Create Nomadic Passport → mint victor.nomadic-passport.eth (Sepolia).
2. Set / verify primary name (forward + reverse).
3. Discover Nomadic Lisbon House Journey + policy disclosure.
4. World Identity Check + Selfie Check → backend: lisbon_house_policy_v1 satisfied.
5. Submit application; mint lisbon-house.victor.nomadic-passport.eth + records.
6. Reload Passport — credential discovered from ENS records (not hardcoded only).
7. Public /p/victor.nomadic-passport.eth reconstructs identity + credential.
8. Grant scoped issuer permission → user revokes → issuer update reverts.
```

```mermaid
sequenceDiagram
  participant User
  participant App as Nomadic
  participant World as World
  participant ENS as Sepolia_ENSv2

  User->>App: Magic login
  App->>ENS: Mint Passport subname
  ENS-->>App: victor.nomadic-passport.eth
  User->>App: Set primary name
  User->>App: Open Lisbon House Journey plus policy
  User->>World: Identity Check plus Selfie Check
  World-->>App: Policy satisfied
  User->>App: Submit application
  App->>ENS: Mint credential child plus records
  App->>ENS: Grant scoped issuer roles
  User->>App: Reload Passport from ENS
  User->>ENS: Revoke issuer
  Note over ENS: Issuer update reverts
```

---

## 5. In scope (P0)

- Keep Magic auth; Passport shell + Passport data APIs.
- **Sepolia ENSv2** Passport mint + credential child + active records + primary name + revoke demo.
- One seeded Community/Journey + policy presentation UI.
- World Identity Check + Selfie Check (after readiness spike); gate credential mint on verify.
- Journey application + `CredentialClaim` (additive backend; wallet key).
- Public `/p/[passport.ens]` reconstructing from Sepolia ENS.
- Mainnet UR readiness retained in CI.
- Hide house-login/NACC/single-use from demo hierarchy; do not delete.

---

## 6. Out of scope (P0)

- Mainnet Passport/credential minting for Lisbon.
- Full multi-community CMS / arbitrary policy engine UI for every house.
- Landing whose only CTA is “Mint ENS” or “Verify age with World” (Journey stays primary).
- Connect → mint random subname → done (no Journey/World).
- Express-side ENS resolution; ENS as sole DB identity.
- contenthash/IPFS, CCIP reputation, Walrus, stipends (P1/P2).
- Claiming ETHGlobal attendance without organizer evidence.
- Deployable World bypasses; storing document/biometric PII on ENS or in DB.

---

## 7. Demo success criteria

1. Login → mint Sepolia Passport ENS; UI uses that name (testnet badge).  
2. Primary name forward+reverse verified (else wallet fallback).  
3. User opens seeded Lisbon House Journey and sees policy disclosure.  
4. Identity Check + Selfie Check complete (or honest unavailable — no fake credential mint).  
5. Application succeeds → credential child ENS minted; Passport reload reads records from ENS.  
6. Same verified World identity cannot double-apply for the same Journey action.  
7. Public `/p/<passport.ens>` reconstructs credential without email.  
8. Scoped issuer grant + user revoke; issuer update reverts.  
7. UI copy does not claim absolute global uniqueness beyond World’s model, nor ETHGlobal attendance.  
8. Judges can separate pre-existing Journeys from Lisbon policy-gated apply (`PREEXISTING_VS_LISBON.md`).

---

## 8. Constraints

- One developer; incremental; keep deployable.  
- Evolve `nomadic-front` + additive `nomadic-back`.  
- Every sponsor integration must serve the Journey → Passport story.  
- Complexity under the UI; product narrative stays Nomadic.

---

## 9. Related documents

| Doc | Purpose |
| --- | --- |
| [`PRODUCT_VISION.md`](./PRODUCT_VISION.md) | Five entities + north star |
| [`LISBON_ARCHITECTURE.md`](./LISBON_ARCHITECTURE.md) | Hybrid FE/BE, models |
| [`LISBON_ROUTES.md`](./LISBON_ROUTES.md) | Pages and API contracts |
| [`LISBON_IMPLEMENTATION_PLAN.md`](./LISBON_IMPLEMENTATION_PLAN.md) | Build order |
| [`PREEXISTING_VS_LISBON.md`](./PREEXISTING_VS_LISBON.md) | Continuity |

# World recommended policy + application flow (Lisbon)

> Derived only from **public World docs + IDKit 4.2.x types** and this spike’s adapters.  
> **Nothing is E2E-confirmed** in this environment (no RP signing key / partner enablement present).  
> Freeze production schema only after partner sandbox green runs.

---

## Packages / endpoints (freeze candidates)

| Item | Value |
| --- | --- |
| Client | `@worldcoin/idkit@4.2.1` |
| Core / signing | `@worldcoin/idkit-core@4.2.2` (`signRequest` via `/signing`) |
| Verify | `POST https://developer.world.org/api/v4/verify/{rp_id}` |
| Identity preset | `identityCheck` (preview) |
| Selfie preset | `selfieCheckLegacy` (partner; legacy Face proof) |

## Exact spike / future actions (names only)

| Action ID | Purpose | Preset |
| --- | --- | --- |
| `spike_world_idkit_v1` | Prototype allowlist only — **not** a claim | Configurable in spike env |
| `lisbon_identity_v1` *(proposed)* | Identity Check for policy attributes | `identityCheck` |
| `apply_lisbon_house_v1` *(proposed)* | Selfie continuity / one-apply uniqueness | `selfieCheckLegacy` |

Register actions in Developer Portal; never hardcode secrets.

## Identifiers to persist (production, post-spike)

After **immediate** portal verify (not on client trust):

| Field | Source | Why |
| --- | --- | --- |
| `uniquenessKey` | Verified Selfie **nullifier** (decimal form) | One Journey apply per World identity×action |
| `verificationProvider` | `"world_selfie"` / `"world_identity"` | Audit |
| `action` | Allowlisted action string | Scope |
| `identityAttested` | `identity_attested === true` | Policy gate |
| `policyKey` | `lisbon_house_policy_v1` | Versioned disclosure |
| `requestedAttributeIds` | e.g. `["minimum_age"]` | Transparency without storing values |
| `verifiedAt` | Server time | Freshness |
| Optional `session_id` | Only if adopting v4 session proofs later | Continuity Option C |

**Never persist:** raw proofs, MRZ, name, DOB, selfies, RP signing keys, full verify payloads.

---

## `lisbon_house_policy_v1` recommendation

### Confirmed P0 attributes

**None — empty set for freeze today.**

Reason: Identity Check and Selfie Check are both **partner/preview**. This workspace has **no** live credentials, and the spike did not complete an end-to-end verify. Per spike rules, do **not** promote age, jurisdiction, or document uniqueness into P0 merely because product wants them.

#### Provisional P0 *candidates* (promote only after sandbox E2E)

| Attribute | Why Journey needs it | Minimization |
| --- | --- | --- |
| **Selfie action uniqueness** (`apply_lisbon_house_v1` nullifier) | Stops duplicate applications from the same World-verified face enrollment for this Journey action; continuity for “same person continuing apply” | Store nullifier + action only; never call it “Orb unique human” |
| **`minimum_age: 18`** via Identity Check | House eligibility / legal age for residency-style programs | Predicate only; never store DOB; disclose “over 18” boolean satisfaction |

If Identity Check enablement slips but Selfie is enabled, ship **Selfie-only continuity** for demo apply and keep age as **aspirational disclosure** (honest “not verified yet”) — do not fake `identity_attested`.

### Aspirational attributes

| Attribute | Why discussed | Why not P0 yet |
| --- | --- | --- |
| Jurisdiction / nationality allowlist | Community may restrict participants | Public API is single-country equality; residence unsupported; multi-country OR unknown |
| `issuing_country` | Proxy for document jurisdiction | Same caveats; easy to mis-copy as “lives in” |
| Unique government document | Strong Sybil / one-doc binding | Requires **Passport/NFC** credential path, not Identity Check attributes; high UX friction |
| Document assurance (CA/AA) | Trust in chip authenticity | Not exposed on Identity Check RP result in public docs |
| Sybil score threshold | Extra abuse signal | Score field to RP **undocumented** |
| `full_name` / `document_number` | Legacy KYC habits | Violates Nomadic minimization — **do not use** |
| World ID 4 session continuity | Later login without re-Selfie | Different API; Selfie today is legacy uniqueness |

---

## Flow options

### Option A — Identity + Selfie in one World request

**Not recommended** for Lisbon given current public SDK:

- One `.preset(...)` per request.  
- Identity Check examples use `allow_legacy_proofs: false`; Selfie legacy requires `true`.  
- Identity Check not listed in `CredentialType` for `constraints(all/any)`.  
- Status: **not confirmed supported**.

### Option B — Two requests, verify independently, join in server VerificationSession

```text
POST /world/request (identity action) → IDKit identityCheck → POST verify
  → ephemeral / session row: identityAttested + identityNullifier?

POST /world/request (selfie action) → IDKit selfieCheckLegacy → POST verify
  → session row: selfieNullifier

Application references VerificationSession id
  → issue NOMADIC_LISBON_HOUSE_ELIGIBLE when policy + uniqueness OK
```

**Recommended** as the robust architecture matching World’s “verify immediately, store nullifier” guidance and Nomadic’s dual roles (eligibility vs continuity).

### Option C — Identity for eligibility + session proof for later continuity

Use Identity Check once; later `createSession` / `proveSession` with `session_id` for return visits.

**Defer:** Selfie Check today is the partner path for face continuity; session proofs are a separate v4 feature and do not replace Selfie enrollment UX. Revisit when 4.0 Selfie + session guidance is partner-confirmed.

---

## Recommended production flow (Option B)

```text
Journey policy disclosure (confirmed vs aspirational copy)
  → World Identity Check (when enabled) → verify now → minimal VerificationSession.identity
  → World Selfie Check → verify now → minimal VerificationSession.selfie (uniquenessKey)
  → Submit application referencing VerificationSession
  → CredentialClaim NOMADIC_LISBON_HOUSE_ELIGIBLE
  → Passport
```

Aligns with:

```text
World proof → verify immediately → store minimal VerificationSession → application references it
```

### Copy principles

- Identity: “Prove only what this House policy needs (e.g. over 18). Nomadic does not receive your date of birth or document number.”  
- Selfie: “Confirm liveness and that the same World-verified identity applies once. This is not Orb-level unique humanity.”  
- Aspirational attributes: label **Not verified in this demo** until E2E green.

---

## Repo note

`Nomadic-Accelerationism/nomadic-back` was **not accessible** from this agent environment. Spike prototype lives in **`nomadic-front`** under `/api/spikes/world/*`. Mirror the same request/verify contracts into Express when backend access is available — still no Prisma / UserProofs / CredentialClaim from the spike.

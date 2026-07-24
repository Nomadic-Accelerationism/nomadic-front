# Lisbon Routes & Contracts — ETHGlobal Lisbon 2026

> Journey-centered contracts for the Lisbon slice.  
> **Not implemented** by this documentation revision.  
> [`LISBON_MVP.md`](./LISBON_MVP.md) · [`LISBON_ARCHITECTURE.md`](./LISBON_ARCHITECTURE.md) · [`PRODUCT_VISION.md`](./PRODUCT_VISION.md)

---

## 1. Conventions

- Auth: `Authorization: Bearer <Magic DID>`.
- Wallet = canonical public key; ENS resolved only in Next.js (page/BFF).
- Express public Passport: **normalized wallet address only**.
- Primary credential: `NOMADIC_LISBON_HOUSE_ELIGIBLE`.
- Policy: `lisbon_house_policy_v1`.
- Selfie continuity action (example): `apply_lisbon_house_v1`.
- Identity Check action IDs: **TBD in World spike** (do not invent final names here).
- Errors: `{ "error": string, "code"?: string }`.
- Never return email publicly; never return raw World proofs, selfies, or RP secrets.
- HTTP methods below are **locked**.

---

## 2. Locked route table

### Frontend pages

| Path | Auth | Purpose | Demo |
| --- | --- | --- | --- |
| `/` | public | Landing (existing) — not “verify with World” | Entry |
| `/login-user` | public | Magic login | Yes |
| `/passport` | required | Private Passport (**P0.1 exists**) | Yes |
| `/journeys` or reuse `/hacker-journeys` | required | Discover Journeys (seed Lisbon House prominent) | Yes |
| `/journeys/[id]` or adapt house/journey detail | required/public read as needed | Journey detail + policy + Apply | Yes |
| `/journeys/[id]/apply` | required | Disclosure + Identity Check + Selfie + submit | Yes |
| `/p/[identifier]` | public | Public Passport | Yes |
| `/credentials/lisbon-2026` | required | Legacy placeholder — reframe or redirect to Journey apply later | Secondary |

Legacy `/user-proofs`, house login, NACC, single-use: remain but demoted.

### Frontend BFF

| Method | Path | Backend | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/passport/me` | `GET /passport/me` | Bearer |
| `GET` | `/api/passport/public/[identifier]` | ENS→wallet then `GET /passport/public/:address` | none |
| `GET` | `/api/journeys/lisbon-house` | Seeded journey + policy | none or Bearer |
| `POST` | `/api/world/request` | `POST /world/request` | Bearer |
| `POST` | `/api/journeys/applications` | `POST /journeys/applications` | Bearer |
| `POST` | `/api/credentials/claim` | `POST /credentials/claim` | Bearer |

Claim may be invoked internally by application submit; both routes may exist if claim is reusable.

### Express

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `GET` | `/passport/me` | Bearer | Private aggregate |
| `GET` | `/passport/public/:address` | none | Wallet only |
| `GET` | `/journeys/lisbon-house` | none/Bearer | Seeded Journey + policy JSON |
| `POST` | `/world/request` | Bearer | RP sign for allowlisted action |
| `POST` | `/journeys/applications` | Bearer | Verify World results + create application (+ credential) |
| `POST` | `/credentials/claim` | Bearer | Allowlisted credential mint after verify |

No Express ENS routes.

---

## 3. Page behaviours

### `/passport` (exists)

Session gate; identity (wallet / unavailable); credentials including Lisbon House Eligible when claimed; private email only in secondary section.

### Journey detail

Show community name, dates, capacity, description, policy summary, Apply CTA.  
Reuse existing visual patterns from journey/house detail where possible.

### Apply flow

1. Transparent disclosure (what is proven / what is not received).  
2. Request Identity Check RP context → IDKit → send result.  
3. Request Selfie RP context (`apply_lisbon_house_v1`) → IDKit → send result.  
4. `POST` application.  
5. Success → Passport shows credential; never fake success if World down.

### `/p/[identifier]`

Normalize → ENS or wallet → Express by address → public credentials; ENS display on FE.

---

## 4. Backend contracts (shapes)

### `GET /passport/me`

**Auth:** required.

```json
{
  "user": { "id": "uuid", "publicAddress": "0xabc...def" },
  "credentials": [
    {
      "credentialKey": "NOMADIC_LISBON_HOUSE_ELIGIBLE",
      "displayName": "Nomadic Lisbon House — Eligible",
      "description": "Eligibility credential for Nomadic Lisbon House after privately satisfying Lisbon House Policy v1 during ETHGlobal Lisbon 2026.",
      "claimedAt": "2026-07-24T12:00:00.000Z",
      "verificationProvider": "WORLD_IDENTITY_AND_SELFIE",
      "metadata": { "policyVersion": "lisbon_house_policy_v1", "journeyId": "..." }
    }
  ],
  "applications": [
    {
      "journeyId": "...",
      "status": "SUBMITTED",
      "policyVersion": "lisbon_house_policy_v1"
    }
  ],
  "legacyProofs": []
}
```

Errors: `401`, `500`.

### `GET /passport/public/:address`

**Auth:** none. Wallet only.

Public credentials only — **no email**, no private applications list unless explicitly productized later as public (default: omit applications).

Errors: `400` malformed, `404` not found, `500`.

### `GET /journeys/lisbon-house`

Returns seeded journey + policy for demo:

```json
{
  "journey": {
    "id": "...",
    "title": "Lisbon Hacker House",
    "communityName": "Nomadic Lisbon House",
    "location": "Lisbon",
    "startDate": "...",
    "endDate": "...",
    "guestCapacity": 20,
    "description": "..."
  },
  "policy": {
    "policyKey": "lisbon_house_policy_v1",
    "version": "1",
    "required": [
      { "id": "age_18_plus", "label": "You are over 18", "status": "pending_world_spike" },
      { "id": "jurisdiction", "label": "You meet its jurisdiction policy", "status": "pending_world_spike" },
      { "id": "unique_document", "label": "You have a unique verified document", "status": "pending_world_spike" }
    ],
    "optional": [],
    "disclosure": {
      "willNotReceive": [
        "legal name",
        "passport number",
        "date of birth",
        "document photograph"
      ]
    }
  }
}
```

`status: pending_world_spike` until Identity Check capabilities are confirmed.

### `POST /world/request`

**Auth:** required.

Body: `{ "action": "<allowlisted_action>" }` — server rejects unknown actions.  
Stable signal: preferably `User.id`.  
Returns IDKit/RP context. Never returns signing secret.

Errors: `401`, `400` invalid action, `503`, `500`.

### `POST /journeys/applications`

**Auth:** required.

```json
{
  "journeyId": "...",
  "policyVersion": "lisbon_house_policy_v1",
  "identityCheckResult": { },
  "selfieCheckResult": { }
}
```

Exact World result field shapes TBD in spike.

Server: verify both; enforce selfie uniqueness for `apply_lisbon_house_v1`; create application; attach `NOMADIC_LISBON_HOUSE_ELIGIBLE` when policy satisfied; bind wallet from trusted `User.publicAddress`.

**200** created or idempotent existing.  
Errors: `401`, `400 INVALID_PROOF`, `400 WALLET_NOT_BOUND`, `400 POLICY_NOT_SATISFIED`, `409` uniqueness, `503 WORLD_UNAVAILABLE`, `500`.

### `POST /credentials/claim`

Allowlisted keys only (`NOMADIC_LISBON_HOUSE_ELIGIBLE`). Prefer application endpoint as primary path; claim remains for explicit credential attach if split.

Same trust/uniqueness rules as architecture doc. Prior standalone `NOMADIC_LISBON_2026` is **not** the P0 primary allowlist key.

---

## 5. Error UX mapping

| Code | UI |
| --- | --- |
| `401` | `/login-user` |
| `WALLET_NOT_BOUND` | Honest bind required |
| `POLICY_NOT_SATISFIED` | Explain which policy bits failed without exposing PII |
| `INVALID_PROOF` | Retry World check |
| Uniqueness `409` | Already applied / identity already used for this Journey |
| Idempotent `200` | Already on Passport / application exists |
| `WORLD_UNAVAILABLE` | Honest unavailable |
| Public `404` | Passport not found |

---

## 6. Out of contract for P0

- Express ENS resolution.  
- Primary mint-ENS or verify-age landings.  
- Full community CRUD APIs.  
- `DEMO_WORLD_BYPASS`.  
- Storing World full payloads / biometrics.  
- Public email discovery.

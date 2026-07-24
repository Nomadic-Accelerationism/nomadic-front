# Lisbon Routes & Contracts — ETHGlobal Lisbon 2026

> Proposed routes and API shapes for the Passport MVP.  
> **Not implemented** in this documentation pass.  
> Companion: [`LISBON_MVP.md`](./LISBON_MVP.md), [`LISBON_ARCHITECTURE.md`](./LISBON_ARCHITECTURE.md).

---

## 1. Conventions

- Auth header for protected routes: `Authorization: Bearer <Magic DID token>` (same as existing BFF).
- Wallet is the canonical public key; ENS is resolved to wallet before data fetch.
- Credential key for P0: `NOMADIC_LISBON_2026`.
- Error bodies use `{ "error": string, "code"?: string }`.
- Never return email on public endpoints.
- Never return raw World proofs, selfies, or biometrics.

---

## 2. Frontend pages

| Path | Auth | Purpose | Primary demo? |
| --- | --- | --- | --- |
| `/` | public | Landing (existing) | Entry |
| `/login-user` | public | Magic email login (existing) | Yes |
| `/passport` | required | Private Passport aggregate | **Yes** |
| `/credentials/lisbon-2026` | required | Claim detail + Selfie Check CTA | Yes |
| `/p/[identifier]` | public | Public Passport (`identifier` = ENS or `0x…`) | **Yes** |
| `/home-user` | required | Existing home — redirect or CTA to `/passport` | Demoted |
| `/user-proofs` | required | Legacy proofs UI | Secondary / hidden from primary CTA |
| `/hacker-journeys` and journey/* | required | Legacy journeys | Hidden from primary demo nav |
| `/login-house`, `/home-house`, `/nacc-tokens`, `/generate-single-use-id` | — | Legacy / mock | Hidden from demo |

### Page behaviours

#### `GET /passport` (page)

- If unauthenticated → redirect `/login-user`.
- Load private aggregate via BFF.
- Resolve ENS from bound wallet for name/avatar.
- Show **Nomadic Lisbon 2026** claimed state or CTA.
- Optional collapsed “Other verifications” from legacy proofs.
- Share affordance linking to `/p/<ens-or-wallet>`.

#### `GET /credentials/lisbon-2026` (page)

- Explains honest credential copy (unique-human Nomadic Lisbon credential).
- Starts World Selfie Check client flow.
- Posts claim to BFF; handles 200 / 409 / 503 honestly.

#### `GET /p/[identifier]` (page)

- No login required.
- Resolve identifier → wallet → public aggregate.
- 404 UI if not found / no bound wallet.

---

## 3. Frontend BFF routes (Next.js `app/api`)

Thin proxies to `NEXT_PUBLIC_NOMADIC_API_URL`, mirroring existing `app/api/auth/*` style.

| Method | BFF path | Backend target | Auth |
| --- | --- | --- | --- |
| GET or POST | `/api/passport/me` | `GET /passport/me` | Bearer DID (forward) |
| GET | `/api/passport/public/[identifier]` | `GET /passport/public/:identifier` | none |
| POST | `/api/credentials/claim` | `POST /credentials/claim` | Bearer DID (forward) |
| GET | `/api/ens/resolve` | optional local resolve **or** skip if client-side ENS | none / none |

**Recommendation:** prefer **client-side ENS** with a public RPC for P0 to reduce surface area; add `/api/ens/resolve` only if server-side resolution is required for the public page SSR.

### BFF notes

- Do not accept a client `userId`.
- For claim: forward DID + proof payload; backend decides wallet binding.
- Map upstream errors to the same HTTP statuses.

---

## 4. Backend endpoints

### 4.1 `GET /passport/me`

**Auth:** required (Magic DID).

**Response `200`:**

```json
{
  "user": {
    "id": "uuid",
    "publicAddress": "0xabc...def"
  },
  "credentials": [
    {
      "credentialKey": "NOMADIC_LISBON_2026",
      "displayName": "Nomadic Lisbon 2026",
      "description": "A unique-human credential claimed through Nomadic during ETHGlobal Lisbon 2026.",
      "claimedAt": "2026-07-24T12:00:00.000Z",
      "verificationProvider": "WORLD_SELFIE_CHECK"
    }
  ],
  "legacyProofs": [
    {
      "proof": "ETHGLOBAL_HACKER",
      "name": "ETHGlobal Hacker",
      "isActive": true
    }
  ]
}
```

Notes:

- `legacyProofs` optional; omit or empty array if unused in UI.
- ENS fields are **not required** from backend if frontend resolves them.
- `publicAddress` may be `null` if not yet bound — UI must handle.

**Errors:** `401`, `500`.

---

### 4.2 `GET /passport/public/:identifier`

**Auth:** none.

**Params:** `identifier` — ENS name (e.g. `alice.eth`) or wallet address.

**Server steps:**

1. If ENS → resolve to address (backend or trust FE-resolved address only when FE already resolved — preferred: backend or shared resolve utility accepts either and normalizes).
2. Lookup by normalized `walletAddress` / `User.publicAddress`.
3. Return public aggregate.

**Response `200`:**

```json
{
  "walletAddress": "0xabc...def",
  "displayName": null,
  "credentials": [
    {
      "credentialKey": "NOMADIC_LISBON_2026",
      "displayName": "Nomadic Lisbon 2026",
      "description": "A unique-human credential claimed through Nomadic during ETHGlobal Lisbon 2026.",
      "claimedAt": "2026-07-24T12:00:00.000Z",
      "verificationProvider": "WORLD_SELFIE_CHECK"
    }
  ],
  "legacyProofs": []
}
```

`displayName` may be omitted; FE can set ENS name after client resolve. Backend must **not** include email.

**Errors:**

| Status | When |
| --- | --- |
| `404` | Unknown identifier / no publicable Passport |
| `400` | Malformed identifier |
| `502` / `503` | ENS resolution dependency failed (if backend resolves ENS) |
| `500` | Unexpected |

---

### 4.3 `POST /credentials/claim`

**Auth:** required (Magic DID → `userId`).

**Request body:**

```json
{
  "credentialKey": "NOMADIC_LISBON_2026",
  "worldProof": {
    "/* opaque shape TBD pending World Selfie Check Beta docs */": true
  }
}
```

**Rules:**

- `credentialKey` must be an allowlisted P0 key (`NOMADIC_LISBON_2026`).
- Do **not** accept a client-chosen `walletAddress` as authoritative ownership. Use `User.publicAddress` from DB when present.
- If `User.publicAddress` is missing, either reject with `400`/`409` explaining wallet binding required, or bind only through a future verified mechanism — never blind body trust.
- Verify `worldProof` server-side; derive `uniquenessKey`; set `verificationProvider = "WORLD_SELFIE_CHECK"`.
- Persist minimal `metadata` only (no selfie / full payload).

**Response `200` (created or idempotent existing):**

```json
{
  "claim": {
    "id": "uuid",
    "credentialKey": "NOMADIC_LISBON_2026",
    "displayName": "Nomadic Lisbon 2026",
    "walletAddress": "0xabc...def",
    "verificationProvider": "WORLD_SELFIE_CHECK",
    "claimedAt": "2026-07-24T12:00:00.000Z",
    "idempotent": false
  }
}
```

Set `idempotent: true` when returning the caller’s existing claim.

**Errors:**

| Status | `code` (suggested) | When |
| --- | --- | --- |
| `401` | `UNAUTHENTICATED` | Missing/invalid DID |
| `400` | `INVALID_PROOF` | World proof failed verification |
| `400` | `INVALID_CREDENTIAL` | Unknown / non-allowlisted key |
| `400` | `WALLET_NOT_BOUND` | No trusted wallet on user yet |
| `409` | `ALREADY_CLAIMED_BY_OTHER` | `uniquenessKey` collision with another user |
| `409` | `UNIQUENESS_CONFLICT` | Generic uniqueness violation |
| `503` | `WORLD_UNAVAILABLE` | Verify API down |
| `500` | `INTERNAL` | Unexpected |

Same user re-claim → **200 idempotent**, not 409.

---

## 5. Optional ENS helper

### `GET /api/ens/resolve?address=0x…` or `?name=alice.eth`

**Auth:** none (public data).

**Response example:**

```json
{
  "name": "alice.eth",
  "address": "0xabc...def",
  "avatar": "https://…"
}
```

**Errors:** `404` unresolved; `400` bad input; `503` RPC failure.

If unimplemented, frontend uses a public ENS library directly with the same UX fallbacks (truncated wallet, no avatar).

---

## 6. Credential catalog (P0 allowlist)

| credentialKey | displayName | Requires |
| --- | --- | --- |
| `NOMADIC_LISBON_2026` | Nomadic Lisbon 2026 | World Selfie Check + uniqueness |

Future keys (not claimable in P0 without evidence pipelines):

```text
ETHGLOBAL_LISBON_2026_PARTICIPANT
HACKER_HOUSE_RESIDENT
EVENT_VOLUNTEER
COMMUNITY_CONTRIBUTOR
```

---

## 7. Error UX mapping (frontend)

| Backend | UI behaviour |
| --- | --- |
| `401` | Redirect to `/login-user` |
| `WALLET_NOT_BOUND` | Explain Passport needs a bound wallet; do not invent one client-side |
| `INVALID_PROOF` | Ask user to retry Selfie Check |
| `ALREADY_CLAIMED_BY_OTHER` | Honest message: this human identity already claimed elsewhere |
| Idempotent `200` | Show “Already on your Passport” |
| `WORLD_UNAVAILABLE` | Honest unavailable state; no fake success |
| Public `404` | “Passport not found” |

---

## 8. Out of contract for P0

- Public journey history endpoints.
- Claim endpoints that mint `ETHGLOBAL_LISBON_2026_PARTICIPANT`.
- Wallet uniqueness constraints as API guarantees.
- `DEMO_WORLD_BYPASS` or preview-enabled fake claim flags.
- Passport CRUD / Passport entity IDs.

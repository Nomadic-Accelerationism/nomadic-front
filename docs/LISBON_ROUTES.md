# Lisbon Routes & Contracts — ETHGlobal Lisbon 2026

> Proposed routes and API shapes for the Passport MVP.  
> **Not implemented** in this documentation pass.  
> Companion: [`LISBON_MVP.md`](./LISBON_MVP.md), [`LISBON_ARCHITECTURE.md`](./LISBON_ARCHITECTURE.md).

---

## 1. Conventions

- Auth header for protected routes: `Authorization: Bearer <Magic DID token>`.
- Wallet is the canonical public key.
- ENS is resolved **only** in Next.js (page and/or BFF) before calling Express.
- Express public Passport accepts **normalized wallet addresses only**.
- Credential key for P0: `NOMADIC_LISBON_2026`.
- World allowlisted action: `claim_nomadic_lisbon_2026`.
- Error bodies use `{ "error": string, "code"?: string }`.
- Never return email on public endpoints.
- Never return raw World proofs, selfies, biometrics, or RP secrets.
- HTTP methods below are **locked** (no GET-or-POST ambiguity).

---

## 2. Locked route table

### Frontend pages

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| page | `/` | public | Landing (existing) |
| page | `/login-user` | public | Magic email login (existing) |
| page | `/passport` | required | Private Passport |
| page | `/credentials/lisbon-2026` | required | Claim + disclosure + Selfie Check |
| page | `/p/[identifier]` | public | Public Passport (ENS name or wallet) |

Legacy pages remain in the repo but are demoted from the demo path (`/home-user`, `/user-proofs`, journeys, houses, NACC, single-use ID).

### Frontend BFF (Next.js)

| Method | Path | Backend target | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/passport/me` | `GET /passport/me` | Bearer DID |
| `GET` | `/api/passport/public/[identifier]` | `GET /passport/public/:address` after ENS→wallet | none |
| `POST` | `/api/world/request` | `POST /world/request` | Bearer DID |
| `POST` | `/api/credentials/claim` | `POST /credentials/claim` | Bearer DID |

### Express backend

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `GET` | `/passport/me` | Bearer DID | Private aggregate |
| `GET` | `/passport/public/:address` | none | **Wallet address only** — never ENS names |
| `POST` | `/world/request` | Bearer DID | RP request signing |
| `POST` | `/credentials/claim` | Bearer DID | Verify + claim |

There is **no** Express ENS resolve route in P0.  
There is **no** optional `GET /api/ens/resolve` requirement; ENS runs in the frontend resolution module (ENSjs + viem). The public BFF may call that module internally when translating `[identifier]` → `:address`.

---

## 3. Frontend page behaviours

### `/passport`

- Unauthenticated → `/login-user`.
- `GET /api/passport/me`.
- Resolve verified primary ENS name + avatar from trusted wallet (frontend).
- Show **Nomadic Lisbon 2026** claimed state or CTA.
- Optional collapsed legacy proofs.
- Share link to `/p/<ens-or-wallet>`.

### `/credentials/lisbon-2026`

- Honest credential copy (World Selfie Check–verified Nomadic Lisbon credential).
- **Public disclosure** before claim completion: claim appears on a public Passport tied to the wallet; list public fields; never email.
- `POST /api/world/request` → IDKit Selfie Check → `POST /api/credentials/claim`.
- Handle 200 / 409 / 503 honestly.

### `/p/[identifier]`

- No login.
- Normalize identifier.
- Domain-like → ENS resolve to wallet (`.eth`, subnames, ENS-imported DNS names; not every dotted string).
- Wallet → use normalized address.
- `GET /api/passport/public/[identifier]` (BFF resolves then calls Express by address).
- 404 UI if not found.

---

## 4. BFF contract details

### `GET /api/passport/me`

Forward Bearer DID to Express `GET /passport/me`. Map statuses. Do not accept client `userId`.

### `GET /api/passport/public/[identifier]`

1. Normalize `identifier`.
2. If wallet → `address = normalized`.
3. If domain-like → ENS name→address via ENSjs/Universal Resolver path.
4. If unresolved/malformed → `400`/`404` without calling Express when appropriate.
5. Call Express `GET /passport/public/:address` with normalized wallet only.
6. Optionally attach client-resolved ENS display fields in the page layer (not required from Express).

### `POST /api/world/request`

Forward Bearer DID to Express. Never log RP secrets. Return request context to client.

### `POST /api/credentials/claim`

Forward Bearer DID + complete IDKit result. Backend decides wallet binding. Map statuses.

---

## 5. Backend endpoint contracts

### 5.1 `GET /passport/me`

**Auth:** required.

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
      "description": "A World Selfie Check–verified credential claimed through Nomadic during ETHGlobal Lisbon 2026.",
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

- `publicAddress` may be `null` until Magic spike binds a wallet.
- ENS fields are **not** returned by Express.
- Never include email in payloads intended for public reuse.

**Errors:** `401`, `500`.

---

### 5.2 `GET /passport/public/:address`

**Auth:** none.

**Params:** `:address` — normalized Ethereum wallet address **only**.

**Response `200`:**

```json
{
  "walletAddress": "0xabc...def",
  "credentials": [
    {
      "credentialKey": "NOMADIC_LISBON_2026",
      "displayName": "Nomadic Lisbon 2026",
      "description": "A World Selfie Check–verified credential claimed through Nomadic during ETHGlobal Lisbon 2026.",
      "claimedAt": "2026-07-24T12:00:00.000Z",
      "verificationProvider": "WORLD_SELFIE_CHECK"
    }
  ],
  "legacyProofs": []
}
```

**Errors:**

| Status | When |
| --- | --- |
| `400` | Not a wallet address / malformed |
| `404` | No publicable Passport for address |
| `500` | Unexpected |

Express does **not** resolve ENS and does **not** return ENS dependency errors.

---

### 5.3 `POST /world/request`

**Auth:** required (Magic DID → User).

**Behaviour:**

1. Authenticate DID; derive User.
2. Use fixed allowlisted action: `claim_nomadic_lisbon_2026`.
3. Use server-derived stable signal, preferably `User.id`.
4. Generate RP request signature server-side.
5. Return expected request context for the current IDKit Selfie Check flow.
6. Never expose or log the RP signing secret.

**Request body:** empty or minimal `{}` (no client-chosen action overrides).

**Response `200`:** opaque request-context object shaped per current World beta SDK (exact fields TBD in World spike).

**Errors:** `401`, `503` if signing/config unavailable, `500`.

---

### 5.4 `POST /credentials/claim`

**Auth:** required (Magic DID → `userId`).

**Request body:**

```json
{
  "credentialKey": "NOMADIC_LISBON_2026",
  "idKitResult": {
    "/* complete IDKit result shape TBD pending World beta SDK */": true
  }
}
```

**Rules:**

- Allowlist `credentialKey = NOMADIC_LISBON_2026` only in P0.
- Do not accept client `walletAddress` as authoritative; use trusted `User.publicAddress` when bound.
- If wallet unbound → `400 WALLET_NOT_BOUND` (until a reliable bind exists).
- Verify `idKitResult` with World; extract verified action-scoped uniqueness value into `uniquenessKey`.
- Set `verificationProvider = "WORLD_SELFIE_CHECK"`.
- Persist minimal metadata only.

**Response `200`:**

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

**Errors:**

| Status | `code` | When |
| --- | --- | --- |
| `401` | `UNAUTHENTICATED` | Missing/invalid DID |
| `400` | `INVALID_PROOF` | World verification failed |
| `400` | `INVALID_CREDENTIAL` | Non-allowlisted key |
| `400` | `WALLET_NOT_BOUND` | No trusted wallet on user |
| `409` | `ALREADY_CLAIMED_BY_OTHER` | uniquenessKey collision with another user |
| `409` | `UNIQUENESS_CONFLICT` | Other uniqueness violation |
| `503` | `WORLD_UNAVAILABLE` | Verify API down |
| `500` | `INTERNAL` | Unexpected |

Same user re-claim → **200** with `idempotent: true`, not 409.

---

## 6. Credential catalog (P0 allowlist)

| credentialKey | displayName | Requires |
| --- | --- | --- |
| `NOMADIC_LISBON_2026` | Nomadic Lisbon 2026 | World Selfie Check action `claim_nomadic_lisbon_2026` + uniqueness |

Future keys (not claimable in P0 without evidence pipelines):

```text
ETHGLOBAL_LISBON_2026_PARTICIPANT
HACKER_HOUSE_RESIDENT
EVENT_VOLUNTEER
COMMUNITY_CONTRIBUTOR
```

---

## 7. Error UX mapping (frontend)

| Backend | UI |
| --- | --- |
| `401` | Redirect `/login-user` |
| `WALLET_NOT_BOUND` | Explain bind requirement; do not invent a wallet client-side |
| `INVALID_PROOF` | Retry Selfie Check |
| `ALREADY_CLAIMED_BY_OTHER` | Honest conflict: this verified World identity already claimed the action |
| Idempotent `200` | “Already on your Passport” |
| `WORLD_UNAVAILABLE` | Honest unavailable; no fake success |
| Public `404` | “Passport not found” |
| ENS resolve failure on public page | Fall back to wallet identifier / 404 if neither works |

---

## 8. Out of contract for P0

- Express ENS resolution.
- `GET /passport/public/:identifier` accepting ENS names on Express.
- Public journey history endpoints.
- Minting `ETHGLOBAL_LISBON_2026_PARTICIPANT`.
- Wallet uniqueness API guarantees.
- `DEMO_WORLD_BYPASS`.
- Passport entity CRUD.
- Persisted ENS name/avatar fields from these endpoints.

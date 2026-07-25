# World Identity Check — capability spike

> Status: **spike complete (docs + SDK typed).** Live E2E blocked without partner Identity Check enablement and RP credentials in this environment.  
> Sources: official World docs (`docs.world.org`), `@worldcoin/idkit` / `@worldcoin/idkit-core` **4.2.x** types. No private beta credentials were available in this workspace.  
> Do **not** treat this file as production policy. Secrets, app IDs, and RP signing keys must never be committed.

## Packages and versions (current npm, Jul 2026)

| Package | Version | Role |
| --- | --- | --- |
| `@worldcoin/idkit` | **4.2.1** | React widgets (`IDKitRequestWidget`, presets) |
| `@worldcoin/idkit-core` | **4.2.2** | Core request API + presets (peer of `idkit`) |
| `@worldcoin/idkit-core/signing` | re-exports `@worldcoin/idkit-server` | Server-only `signRequest` |
| `@worldcoin/idkit-server` | **1.1.1** | RP signature implementation |

Do **not** use IDKit 2.x / 3.x tutorials or `@worldcoin/idkit-standalone` patterns.

## Access and environment

| Item | Finding |
| --- | --- |
| Identity Check availability | **Preview / partner.** Docs: “Identity Check is currently in preview. To use it or learn more, contact us.” |
| Sandbox | World Sandbox exists (isolated World ID app + `environment`). Identity Check sandbox pass/fail fixtures: **unknown / needs World team**. |
| Invite codes | Supported by IDKit (`requestWithInviteCode`) for cold iOS flows; not Identity-Check-specific. |
| RP signing | Required for World ID 4.0. Backend `signRequest({ signingKeyHex, action, ttl? })` → `{ sig, nonce, createdAt, expiresAt }` → client `rp_context`. |
| Verify endpoint | `POST https://developer.world.org/api/v4/verify/{rp_id}` (also `developer.worldcoin.org`; staging host documented). Forward IDKit payload **unchanged**. |

## Request shape (documented)

```ts
import { IDKit, identityCheck } from "@worldcoin/idkit-core";

const preset = identityCheck({
  attributes: [
    { type: "minimum_age", value: 18 },
    // optional additional attributes in the same array
  ],
  // optional: legacy_signal?: string
});

const request = await IDKit.request({
  app_id: "<from portal — do not commit>",
  action: "spike_identity_lisbon_v1", // allowlisted test action only
  rp_context, // from backend signRequest
  allow_legacy_proofs: false, // docs examples for Identity Check
}).preset(preset);
```

### Documented attribute types (`IdentityAttribute`)

| `type` | Value | Notes |
| --- | --- | --- |
| `minimum_age` | `number` | Threshold predicate |
| `nationality` | ISO 3166-1 **alpha-3** string | Exact match semantics in public docs |
| `issuing_country` | ISO 3166-1 **alpha-3** string | Document issuing country |
| `document_type` | `"passport"` \| `"eid"` \| `"mnc"` | |
| `document_number` | `string` | High sensitivity — avoid for Nomadic |
| `full_name` | `string` | High sensitivity — avoid for Nomadic |

## Response / verification shape (documented)

IDKit uniqueness (v4) result may include:

```ts
{
  protocol_version: "4.0",
  nonce: string,
  action: string,
  responses: ResponseItemV4[], // includes nullifier, proof, issuer_schema_id, expires_at_min, …
  user_presence_completed: boolean,
  environment: string,
  identity_attested?: boolean // "Only present on IdentityCheck responses"
}
```

Portal `POST /api/v4/verify/{rp_id}` success returns sanitized portal fields (`success`, `results[]`, optional top-level `nullifier`, `action`, `session_id` for session proofs, …). Public OpenAPI does **not** document a rich per-attribute claim map for Identity Check — RP-facing outcome is centered on **`identity_attested`** (boolean) plus standard proof/`nullifier` verification.

Failure relevant to Identity Check (IDKit error): `identity_attributes_not_matched`.

## Capability matrix

Legend: **confirmed** = public docs + SDK types agree · **caveats** = documented but partner/preview/E2E incomplete · **not supported** · **unknown** = needs World team.

| # | Requirement | Status | Detail |
| --- | --- | --- | --- |
| 1 | Age threshold `age >= 18` | **Supported with caveats** | Via `minimum_age: 18`. Preview access required. Not E2E-proven in this spike. |
| 2 | Age without returning DOB | **Supported with caveats** | Docs: attest attributes without RP handling underlying document data. RP gets match boolean (`identity_attested`), not DOB. Confirm with World that DOB never appears in verify payload. |
| 3 | Jurisdiction eligibility | **Supported with caveats** | Only as `nationality` and/or `issuing_country` equality checks — **not** “residence”. |
| 4 | Meaning of jurisdiction | **Partially confirmed** | **Nationality:** attribute `nationality`. **Document issuing country:** `issuing_country`. **Residence:** **not supported** in public attribute list. **Configurable country/region set:** public SDK shows a **single** alpha-3 value per attribute; OR-of-many / denylist / region packs: **unknown**. |
| 5 | Unique government document | **Not via Identity Check alone** | Use World ID **Passport / NFC credential** (`passport` preset, credential schema 9303): “guaranteed issued to a single World ID per unique document.” Separate product from Identity Check attribute asks. |
| 6 | Document assurance/auth level | **Unknown for Identity Check** | NFC credential exposes Authentication Claim levels (PA/CA/AA/MNC) in credential structure. Identity Check public docs do not say the RP receives assurance level. |
| 7 | Combine multiple attributes in one request | **Confirmed (docs/SDK)** | `attributes: [...]` array on `identityCheck`. |
| 8 | Selective disclosure / predicate proofs | **Supported with caveats** | Predicates like `minimum_age` and equality on nationality/issuing_country/document_type. Not a general ZK query language. Avoid requesting `full_name` / `document_number`. |
| 9 | Credential expiration | **Unknown for Identity Check result TTL** | v4 response items include `expires_at_min` for credential proofs. How Identity Check attestations expire / re-check: **needs World**. NFC passport credential has `expires_at` (max 10y). |
| 10 | Supported countries / documents | **Unknown (expanding)** | NFC docs: passports/eIDs + Japan MNC; availability varies by country. Identity Check country coverage matrix not published. |
| 11 | Sandbox identities pass/fail | **Unknown** | Selfie Sandbox docs exist; Identity Check sandbox fixtures not documented publicly. |
| 12 | What RP receives | **Boolean attestation + proof envelope** | Documented: `identity_attested`. Plus standard verify success/`nullifier`. Not documented as returning raw claims/DOB/name to RP when using threshold/equality attributes. |
| 13 | Minimum persist for Nomadic | **Recommendation (not yet frozen)** | After portal verify: `success`, `identity_attested === true`, `action`, verified `nullifier` (as uniqueness key if World issues one for this action), `policyKey`, requested attribute **ids** (not values), timestamp. **Never** store raw proof, name, document number, DOB. |
| 14 | Combine Identity Check with another credential request | **Unknown / likely separate** | One `.preset(...)` at a time. `constraints(all/any(...))` uses `CredentialRequest` types (`proof_of_human` \| `selfie` \| `passport` \| `mnc`) — **Identity Check is not listed** as a `CredentialType`. Combining Identity Check + Selfie in **one** IDKit request is **not confirmed**. |

---

## Per-attribute deep dive (docs-confirmed candidates)

### A. `minimum_age` (e.g. 18)

| Aspect | Notes |
| --- | --- |
| Request | `{ type: "minimum_age", value: 18 }` |
| Response | Expect `identity_attested: true/false` on success path; mismatch → `identity_attributes_not_matched` |
| Verification | Forward IDKit result to `/api/v4/verify/{rp_id}`; require portal `success` and `identity_attested === true` |
| Privacy | Predicate; RP should not receive DOB if World holds to “no underlying document data” promise — **confirm** |
| Friction | User needs enrolled document-backed identity in World App; preview gating |
| Failure | User rejected; credential unavailable; attributes not matched; RP signature errors |

### B. `nationality` / `issuing_country`

| Aspect | Notes |
| --- | --- |
| Request | `{ type: "nationality", value: "PRT" }` or `{ type: "issuing_country", value: "PRT" }` |
| Response | Same boolean attestation model |
| Verification | Same as above |
| Privacy | Reveals whether user matches **that exact** country code — still sensitive; prefer allowlists designed as product policy, not fishing |
| Friction | Same document enrollment; wrong mental model if product said “residence” |
| Failure | Same + policy mismatch |

**Do not** request `full_name` or `document_number` for Lisbon House.

### C. Unique document (via `passport` preset — related but separate)

| Aspect | Notes |
| --- | --- |
| Request | `passport({ signal })` with `allow_legacy_proofs` per migration needs |
| Response | Standard uniqueness/nullifier proof for passport credential |
| Privacy | Proves unique NFC document binding without Nomadic storing MRZ |
| Friction | NFC enrollment is heavier than Selfie; country coverage varies |
| Failure | Credential unavailable; cold install; unsupported document |

---

## What this spike did **not** confirm E2E

- Partner enablement of Identity Check on Nomadic’s RP.
- Exact verify JSON when `identity_attested` is false vs error.
- Multi-country OR policies.
- Residence / geo jurisdiction.
- Assurance level returned to RP.
- Sandbox pass/fail personas for Identity Check.

## Blockers for World team

1. Enable Identity Check preview on hackathon RP + confirm sandbox testing path.  
2. Confirm DOB/name/number never appear in `/v4/verify` response for predicate asks.  
3. Confirm how to express **allowlist of countries** (multiple `nationality` / `issuing_country`).  
4. Confirm whether Identity Check can share a request with Selfie / Passport via `constraints`.  
5. Publish country/document coverage for Identity Check.  
6. Confirm nullifier semantics specifically for Identity Check actions (replay rules).

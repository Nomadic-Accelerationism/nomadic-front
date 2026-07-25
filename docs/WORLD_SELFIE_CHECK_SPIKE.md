# World Selfie Check — capability spike

> Status: **spike complete (docs + SDK typed).** Live E2E blocked without Selfie Check partner access and RP credentials in this environment.  
> Selfie Check is **low-assurance** liveness + facial similarity. It is **not** high-assurance proof of unique humanity (that is Orb / Proof of Human).

## Packages and preset

| Item | Value |
| --- | --- |
| React | `@worldcoin/idkit@4.2.1` |
| Core | `@worldcoin/idkit-core@4.2.2` |
| Current preset | **`selfieCheckLegacy`** (`type: "SelfieCheckLegacy"`) |
| Protocol today | Returns a **World ID 3.0 Face / legacy** proof |
| `allow_legacy_proofs` | Must be **`true`** for this preset |
| World ID 4.0 Selfie | Docs: “rolling out soon”; `CredentialType` already includes `"selfie"` for constraints — **not** the production path to rely on for Lisbon until confirmed |
| Access | **Select partners** — contact World / TFH |

```ts
import { IDKit, selfieCheckLegacy } from "@worldcoin/idkit-core";

const request = await IDKit.request({
  app_id: "<portal — do not commit>",
  action: "spike_selfie_lisbon_v1",
  rp_context,
  allow_legacy_proofs: true,
}).preset(selfieCheckLegacy({ signal: "<stable user or journey binding>" }));
```

## What Selfie Check is for (product docs)

Official Selfie Check (Beta) use cases:

1. **Liveness** — real person present; anti-spoof / injection.  
2. **Sybil resistance (lower assurance)** — facial similarity / “Sybil score” signal against abnormal multi-account creation on **your** platform.  
3. **Continuity** — returning-user **Face Auth** vs first-time enrollment selfie.

Do **not** copy UI that claims Orb-level unique humanity.

## Continuity matrix

| Concept | What it is | What RP should use |
| --- | --- | --- |
| **Liveness** | Camera challenge that user is present | Flow completion + optional `require_user_presence` on *other* credentials; Selfie itself is liveness-oriented |
| **Action uniqueness** | Nullifier scoped to `(user World ID, app/RP, action)` | After `/v4/verify`, persist verified **`nullifier`** + `action` (decimal/`NUMERIC(78,0)` recommended by World) |
| **Returning-user continuity** | Face Auth UX for already enrolled Selfie users | Same nullifier for same action ⇒ same person-for-this-app-action; enrollment vs auth is World App UX |
| **Sybil score** | Similarity signal described in credential marketing | **Unknown whether score is returned to RP** in public verify schema — **needs World team**. Do not design Nomadic storage around an undocumented score field. |
| **`session_id` (World ID 4 session proofs)** | Opaque `session_<128 hex>` from **session** create/prove flows | **Not produced by `selfieCheckLegacy` uniqueness requests.** Session proofs are a different IDKit path (`createSession` / `proveSession`). |

### Nullifier vs `session_id`

| | `selfieCheckLegacy` (today) | Session proof (v4) |
| --- | --- | --- |
| Result shape | Uniqueness proof (`action` + `nullifier` in responses / verify summary) | `session_id` + `session_nullifier` tuple |
| Continuity for Journey apply | **Use action-scoped nullifier** | Only if product adopts session architecture later |
| Recommended for Lisbon P0 | **Yes (partner access permitting)** | Optional later (Option C) |

## Separate actions? Combined requests?

| Question | Finding |
| --- | --- |
| Separate actions for Selfie vs Identity Check? | **Yes — treat as separate allowlisted actions.** Different presets; different `allow_legacy_proofs` defaults in docs (`true` vs `false`). |
| Request together in one IDKit call? | **Not confirmed.** Single `.preset(...)`. Identity Check not in `CredentialRequest` union for `constraints(all(...))`. |
| Combine Selfie + Passport via constraints? | **Possibly** via `constraints(all(CredentialRequest('passport'), CredentialRequest('selfie')))` once v4 selfie is live — **untested**; still not Identity Check. |

## Mobile / desktop / invite-code

| Surface | Behaviour (docs) |
| --- | --- |
| Mobile | Deep link / connect URI → World App; install funnel if missing |
| Desktop | QR → phone completes → proof returns to web session |
| Invite code | `IDKit.requestWithInviteCode` — landing with invite code + QR; important for **iOS cold** installs; Sandbox notes platform differences |
| Mini App | Native transport (no QR) inside World App |
| Sandbox testing | Dedicated guide: Hot / Cold / Semi-cold; store install links limited in Sandbox; iOS Semi-cold quirks |

## Backend persistence (when leaving spike)

Spike routes **must not** persist. For future production VerificationSession:

| Persist | Do not persist |
| --- | --- |
| Verified `nullifier` (as `uniquenessKey`) | Raw proof / merkle / full IDKit payload |
| `action` (e.g. `apply_lisbon_house_v1`) | Selfie images / biometrics |
| `verificationProvider: "world_selfie"` | Undocumented Sybil score unless World confirms field |
| `verifiedAt`, `protocol_version`, `environment` | RP signing key, app secrets |
| Optional bound `signal` hash/value you enforced | |

## Verification process

1. Backend signs RP context for allowlisted Selfie action only.  
2. Client opens IDKit with `selfieCheckLegacy`.  
3. Client posts IDKit result to backend.  
4. Backend `POST` body **as-is** to `https://developer.world.org/api/v4/verify/{rp_id}`.  
5. On success, read nullifier from portal summary / result items; never log full payload.

## Failure states (representative)

| Code / situation | User-facing meaning |
| --- | --- |
| `user_rejected` / cancelled | User backed out |
| `credential_unavailable` | Selfie not available / not enabled for RP |
| `user_presence_failed` | Liveness step failed (when required) |
| `invalid_rp_signature` / expired | Backend signing clock/key issue |
| `nullifier_replayed` | Same action already used (portal or app policy) |
| Partner not enabled | Integration blocked before UX |

## Blockers for World team

1. Confirm Nomadic RP is on Selfie Check partner allowlist (prod + sandbox).  
2. Confirm whether any **Sybil score** field is returned to RPs after verify (name, type, threshold guidance).  
3. Timeline for World ID **4.0 Selfie** preset vs continued `selfieCheckLegacy`.  
4. Recommended action naming / max-verifications settings for Journey “one apply”.  
5. Whether Face Auth continuity nullifier is stable across reinstall for the same World ID + action.

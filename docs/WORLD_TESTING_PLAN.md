# World testing plan (Identity Check + Selfie Check)

> Companion to `WORLD_IDENTITY_CHECK_SPIKE.md`, `WORLD_SELFIE_CHECK_SPIKE.md`, `WORLD_RECOMMENDED_FLOW.md`.  
> Execute after partner enablement + sandbox app install. Spike routes: `POST /api/spikes/world/request`, `POST /api/spikes/world/verify`.

---

## Developer testing

### Setup friction

| Check | Pass criteria | Notes |
| --- | --- | --- |
| Portal RP registration / World ID 4.0 enabled | `app_id`, `rp_id`, server-only signing key available | Never commit keys |
| Partner flags | Identity Check preview + Selfie Check enabled on RP | Both are gated |
| Sandbox World ID app installed | Device can open sandbox deep links | Store links differ from prod |
| Env wired (names only) | Spike env vars set locally / secrets manager | See `.env.example` placeholders |
| Action allowlist | Only spike actions signable | Production claim actions rejected by spike |

### SDK / API friction

| Check | Pass criteria |
| --- | --- |
| `@worldcoin/idkit@4.2.1` + `@worldcoin/idkit-core@4.2.2` | Install clean; widgets load |
| `signRequest` from `@worldcoin/idkit-core/signing` | Returns `{ sig, nonce, createdAt, expiresAt }` |
| Identity: `identityCheck` + `allow_legacy_proofs: false` | Request opens; no malformed_request |
| Selfie: `selfieCheckLegacy` + `allow_legacy_proofs: true` | Request opens |
| Verify forward | Backend POSTs IDKit JSON unchanged to `/api/v4/verify/{rp_id}` |
| Combined single request Identity+Selfie | Expect fail / unsupported — document actual error |

### Types and schema issues

| Check | Pass criteria |
| --- | --- |
| `identity_attested` present on Identity success | Typed + observed in sanitized summary |
| Selfie result is uniqueness (no `session_id`) | Confirmed |
| Nullifier format | Hex → decimal storage strategy validated |
| Portal error codes mapped | `identity_attributes_not_matched`, `invalid_rp_signature`, etc. |

### RP signing

| Check | Pass criteria |
| --- | --- |
| Action bound in signature | Mismatch action rejected by World |
| TTL expiry | Expired `rp_context` → `rp_signature_expired` / similar |
| Key never on client | Bundle / network inspection clean |
| Clock skew | Documented failure mode |

### Documentation gaps (log as found)

- Multi-country allowlists for nationality / issuing_country.  
- Whether Sybil score is returned to RP.  
- Identity Check sandbox personas.  
- Exact verify payload when attributes fail vs hard error.  
- Assurance level on Identity Check.

### Mobile / desktop behaviour

| Journey | Hot | Cold | Semi-cold |
| --- | --- | --- | --- |
| Web + QR | Proof returns to tab | Install + invite (iOS) | Recovery quirks (esp. iOS) |
| Mobile deep link | Same-device return | Install funnel | Reinstall + invite |

Record: QR scan failures, `return_to` deep link, Mini App native path if used.

### Errors and retries

| Scenario | Expected |
| --- | --- |
| User cancels | Idempotent; new RP signature on retry |
| Attributes not matched | Clear policy failure; no partial claim |
| World 503 / verify timeout | Spike returns sanitized error; no persist |
| Double submit same nullifier | Rejected when uniqueness enforced (prod) |

### Verification latency

Measure: RP sign → QR shown → proof returned → `/v4/verify` RTT. Target: note p50/p95 for demo choreography.

### Sandbox limitations

- No production identity / load / security cert.  
- App store install links incomplete.  
- iOS Semi-cold invite-code pitfalls.  
- Sandbox proofs must never mint production credentials.

---

## User testing

Recruit: 5–8 people spanning World App installed vs not; iOS + Android; desktop apply.

### Comprehension of each requested attribute

| Prompt | Capture |
| --- | --- |
| “What did Nomadic ask World to prove?” | Free text vs intended policy |
| Age vs DOB | Do they think we store birthday? |
| Jurisdiction wording | Nationality vs residence confusion |
| Selfie purpose | Liveness / one-apply vs “unique human forever” |

### Consent

- Was consent screen in World App understandable?  
- Could they refuse mid-flow and return safely?

### Why the attribute is necessary

- After reading Journey policy, can they restate *why* age / selfie is needed for Lisbon House?

### Privacy understanding

- What do they believe Nomadic stores?  
- What do they believe World stores?  
- Trust score 1–5 pre/post.

### World App handoff

- Deep link success rate (mobile).  
- QR success rate (desktop).  
- Time to first successful handoff.

### QR / deep-link friction

- Drop-offs at QR, camera permission, wrong app scan.

### Installation friction

- Cold start: App Store / Play / invite code (iOS).  
- Abandoned installs.

### Drop-off by stage

1. Policy disclosure → Start World  
2. Identity Check complete  
3. Selfie Check complete  
4. Application submit  
5. Passport credential visible  

### Completion time

- Median wall clock Identity-only, Selfie-only, both.

### Trust and willingness to continue

- “Would you use this for another house Journey?”  
- Open feedback on scary / unclear copy.

### Lightweight capture surface

Optional tester form (does not interrupt the normal apply path):

- `/testing/lisbon-feedback` — stores notes in the browser only; does not invent results.

Suggested prompts on that page:

- completion time;
- where the user hesitated;
- whether they understood the 18+ requirement;
- whether they understood what data Nomadic received;
- whether Identity Check and Selfie Check felt distinct;
- whether they would continue in a real application.

---

## Exit criteria for freezing policy / schema

| Gate | Required |
| --- | --- |
| Selfie E2E sandbox | Verify + nullifier observed; sanitized API only |
| Identity E2E (if in P0) | `identity_attested` true/false cases |
| No secret leakage | Logs, client bundle, git |
| Copy review | No Orb-level claims; aspirational labeled |
| Flow choice | Option B validated or documented exception |

Until gates pass, keep `lisbon_house_policy_v1` **P0 attribute set empty** (see `WORLD_RECOMMENDED_FLOW.md`).

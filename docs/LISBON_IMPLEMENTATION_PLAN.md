# Lisbon Implementation Plan — ETHGlobal Lisbon 2026

> Solo-developer, Journey-centered P0.  
> Vision: [`PRODUCT_VISION.md`](./PRODUCT_VISION.md) · MVP: [`LISBON_MVP.md`](./LISBON_MVP.md) · Arch: [`LISBON_ARCHITECTURE.md`](./LISBON_ARCHITECTURE.md) · Routes: [`LISBON_ROUTES.md`](./LISBON_ROUTES.md)

---

## Principles

- Preserve Nomadic: Journey → private policy proof → credential → Passport.  
- Do not ship a World KYC landing or ENS-mint primary flow.  
- Additive backend; do not redesign all Journey/UserProofs tables.  
- Magic wallet spike before `User.publicAddress`.  
- World Identity + Selfie spike before freezing claim/application schemas.  
- ENS: ENSv2-ready resolve via ENSjs + Universal Resolver; subnames/delegation later.  
- No `DEMO_WORLD_BYPASS`.  
- Walrus / direct ENSv2 experiments only after P0.

---

## Locked build order

```text
1.  Docs revision (this pass) + PRODUCT_VISION.md
2.  P0.1 Passport shell + nav          ← DONE on branch
3.  Seed Nomadic Lisbon House Journey + policy presentation UI
4.  Magic wallet metadata readiness spike
5.  Passport private read API
6.  Frontend BFF + real private Passport data
7.  ENSv2-ready ENSjs + viem resolve/display
8.  Public Passport (/p/[identifier] → wallet → Express)
9.  World Identity Check + Selfie Check readiness spike
10. JourneyApplication + CredentialClaim migrations
11. World request / verify / application submit (+ claim)
12. Apply UI + end-to-end Journey demo script + continuity check
13. P1 — ENS credential subnames / richer policy engine
14. P2 — issuer delegation, Walrus, direct ENSv2 experiments
```

---

## P0 tasks

### P0.0 Documentation (this pass)

| | |
| --- | --- |
| **Repo** | `nomadic-front` |
| **Files** | `docs/PRODUCT_VISION.md`, `docs/LISBON_*.md`, `docs/PREEXISTING_VS_LISBON.md` |
| **Acceptance** | Journey-first P0; five entities; World dual roles; ENS staged; anti-patterns documented |
| **Fallback** | n/a |

### P0.1 Passport shell + demo navigation — **DONE**

| | |
| --- | --- |
| **Repo** | `nomadic-front` |
| **Files** | `app/passport/`, `components/passport/`, `lib/wallet.ts`, `HomeUser`, `MenuUserHeader`, `UserContext.isInitialized` |
| **Acceptance** | `/passport` auth states; nav primary Passport; placeholder credential card (will be reframed to Journey eligible) |
| **Fallback** | Session-only shell |

### P0.2 Seed Lisbon House Journey + policy UI

| | |
| --- | --- |
| **Repo** | `nomadic-front` (+ light back seed if needed) |
| **Files** | Journey detail/apply pages; policy disclosure components; optional `GET /journeys/lisbon-house` |
| **Deps** | P0.1 |
| **Acceptance** | User can open Nomadic Lisbon House Journey, read policy disclosure (what is / is not received), see Apply CTA; no fake World success |
| **Fallback** | Static seeded JSON in FE for UI review only, clearly marked non-authoritative |

### P0.3 Magic wallet metadata spike

| | |
| --- | --- |
| **Repo** | `nomadic-back` |
| **Acceptance** | Document real Magic Admin/client metadata; decide `User.publicAddress`; no secret/PII logging |
| **Fallback** | `WALLET_NOT_BOUND` path |

### P0.4 Passport private API

| | |
| --- | --- |
| **Repo** | `nomadic-back` |
| **Files** | `GET /passport/me` |
| **Acceptance** | Auth aggregate with credentials/applications arrays (may be empty) |
| **Fallback** | Empty lists |

### P0.5 BFF + wire Passport

| | |
| --- | --- |
| **Repo** | `nomadic-front` |
| **Files** | `app/api/passport/me/route.ts` |
| **Acceptance** | Passport loads server data when available |
| **Fallback** | Shell fields |

### P0.6 ENSv2-ready integration

| | |
| --- | --- |
| **Repo** | `nomadic-front` |
| **Packages** | `@ensdomains/ensjs` ≥ 4.2.3; `viem` ≥ 2.35.0; resolve Privy transitive viem conflict |
| **Acceptance** | Reverse+forward verify; avatar; fallbacks; `ur.integration-tests.eth` → `0x2222…2222`; input matrix from prior ENS tests |
| **Fallback** | Truncated wallet |

### P0.7 Public Passport

| | |
| --- | --- |
| **Repo** | front + back |
| **Files** | `GET /passport/public/:address`; BFF public `[identifier]`; `app/p/[identifier]` |
| **Acceptance** | ENS→wallet in FE/BFF; Express address-only; no email |
| **Fallback** | Share by `0x` |

### P0.8 World Identity + Selfie readiness spike

| | |
| --- | --- |
| **Repo** | front + back |
| **Acceptance** | Confirm Identity Check attribute coverage for policy v1; Selfie action uniqueness field; RP signing with `User.id`; mark policy attributes confirmed vs aspirational |
| **Fallback** | Honest unavailable + recorded demo |
| **Gate** | Do **not** freeze migrations before this spike |

### P0.9 Application + CredentialClaim migrations

| | |
| --- | --- |
| **Repo** | `nomadic-back` |
| **Acceptance** | Additive models per architecture; uniqueness constraints; no wallet unique; no PII columns |
| **Fallback** | n/a |

### P0.10 World endpoints + application submit

| | |
| --- | --- |
| **Repo** | back + FE BFF |
| **Files** | `POST /world/request`, `POST /journeys/applications`, optional `POST /credentials/claim` |
| **Acceptance** | Dual verify; idempotent apply; 409 conflicts; 503 World down; credential `NOMADIC_LISBON_HOUSE_ELIGIBLE` |
| **Fallback** | Local-only adapter; recorded demo |

### P0.11 Apply UI + E2E demo script

| | |
| --- | --- |
| **Repo** | `nomadic-front` (+ docs) |
| **Acceptance** | Full Journey demo script matches MVP success criteria; continuity docs updated |
| **Fallback** | Partial honest demo paths documented |

---

## ENS acceptance tests (P0.6)

1. `ur.integration-tests.eth` → `0x2222222222222222222222222222222222222222`  
2. Forward name → wallet  
3. Reverse wallet → primary name  
4. Bidirectional verification  
5. Avatar present / absent (absent must not fail Passport)  
6. Inputs: `.eth`, subname, ENS DNS name, wallet, malformed, unresolved  
7. RPC failure → wallet fallback  

---

## P1

| ID | Task |
| --- | --- |
| P1.1 | ENS credential subname representation (UI cards + optional records) |
| P1.2 | Richer policy engine beyond single seeded Journey |
| P1.3 | Share UX, empty states, TS harden new files |
| P1.4 | Reframe/remove obsolete `/credentials/lisbon-2026` placeholder |

---

## P2 / deferred

| ID | Task |
| --- | --- |
| P2.1 | Scoped issuer delegation |
| P2.2 | Walrus metadata |
| P2.3 | Direct experimental ENSv2 contracts (when official + stable + team-confirmed) |
| P2.4 | Wallet ownership signatures → stronger wallet constraints |

Also deferred: new app/monorepo, Passport DB entity, ENS DB columns, Express ENS, deleting legacy features, `DEMO_WORLD_BYPASS`, absolute “globally unique human” claims beyond World’s model.

---

## Next implementation after this docs pass

**P0.2 — Seed Nomadic Lisbon House Journey + policy presentation UI** in `nomadic-front` (and minimal backend seed if required).  
No World/ENS package work in that slice unless already present.

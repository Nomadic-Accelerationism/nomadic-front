# Lisbon Implementation Plan — ETHGlobal Lisbon 2026

> Solo-developer, Journey-centered P0.  
> Vision: [`PRODUCT_VISION.md`](./PRODUCT_VISION.md) · MVP: [`LISBON_MVP.md`](./LISBON_MVP.md) · Arch: [`LISBON_ARCHITECTURE.md`](./LISBON_ARCHITECTURE.md) · Routes: [`LISBON_ROUTES.md`](./LISBON_ROUTES.md)

---

## Principles

- Preserve Nomadic: Journey → private policy proof → credential → Passport.  
- Do not ship a landing that is only “Mint ENS” or “Verify with World”.  
- Additive backend; do not redesign all Journey/UserProofs tables.  
- Magic wallet spike before `User.publicAddress`.  
- World Identity + Selfie spike before freezing claim/application schemas.  
- **ENS P0:** Sepolia ENSv2 mint Passport + credential child + active records + primary name + revoke (see [`ENS_SEPOLIA_V2_CYCLE.md`](./ENS_SEPOLIA_V2_CYCLE.md)).  
- Mainnet Universal Resolver readiness retained in CI.  
- No `DEMO_WORLD_BYPASS`.  
- contenthash / CCIP / Walrus after the onchain Sepolia cycle.

---

## Locked build order

```text
1.  Docs revision + PRODUCT_VISION + ENS Sepolia cycle lock
2.  P0.1 Passport shell + nav          ← DONE on branch
3.  Seed Nomadic Lisbon House Journey + policy presentation UI
4.  Magic wallet metadata readiness spike
5.  Passport private read API + BFF
6.  World Identity + Selfie readiness spike   ← docs/spike done; E2E gated
7.  Pin Sepolia ENSv2 deployment + parent nomadic-passport.eth
8.  Sepolia Passport mint + primary name + records → UI
9.  JourneyApplication + CredentialClaim migrations
10. World verify + application submit
11. Sepolia credential child mint + records reload from ENS
12. Scoped issuer grant + revoke revert demo
13. Public /p/[passport.ens] reconstruct from Sepolia ENS
14. E2E 90s demo script + continuity check
15. P1 — contenthash/IPFS manifest, multi-credential polish
16. P2 — CCIP-Read, Walrus ref, stipends
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

### P0.6 World Identity + Selfie readiness spike

| | |
| --- | --- |
| **Repo** | front (+ back when available) |
| **Status** | Docs + `/api/spikes/world` done; live E2E partner-gated |
| **Acceptance** | Confirmed vs aspirational policy attributes; no fake credential mint |
| **Gate** | Credential ENS child requires verify success |

### P0.7 Pin Sepolia ENSv2 + parent namespace

| | |
| --- | --- |
| **Repo** | front (+ ops) |
| **Acceptance** | Env-pinned v2 factories/registries; control of `nomadic-passport.eth` on Sepolia deployment |
| **Fallback** | Block mint UI: “ENS Sepolia not configured” |

### P0.8 Passport ENS mint + primary name + records

| | |
| --- | --- |
| **Repo** | `nomadic-front` |
| **Acceptance** | Onboarding mints `*.nomadic-passport.eth`; primary name bidirectional; `com.nomadic.*` records; Sepolia badge; UI uses ENS name |
| **Fallback** | Wallet-only Passport + honest ENS unavailable |

### P0.9 Application + CredentialClaim migrations

| | |
| --- | --- |
| **Repo** | `nomadic-back` |
| **Acceptance** | Additive models; uniqueness; no PII; wallet remains key |
| **Fallback** | n/a |

### P0.10 World verify + application submit

| | |
| --- | --- |
| **Repo** | back + FE BFF |
| **Acceptance** | Dual verify; idempotent apply; 409; 503 World down |
| **Fallback** | Honest unavailable — **no** credential ENS mint |

### P0.11 Credential ENS child + records reload

| | |
| --- | --- |
| **Repo** | `nomadic-front` |
| **Acceptance** | Mint `lisbon-house.<passport>`; write public records; Passport reload discovers via ENS |
| **Fallback** | DB credential + “ENS credential pending” |

### P0.12 Scoped issuer permission + revoke

| | |
| --- | --- |
| **Repo** | `nomadic-front` |
| **Acceptance** | Four txs: Passport mint, credential mint, grant issuer, revoke; post-revoke issuer update reverts |
| **Fallback** | Recorded demo if roles blocked |

### P0.13 Public Passport from ENS

| | |
| --- | --- |
| **Repo** | front + back |
| **Acceptance** | `/p/victor.nomadic-passport.eth` → Sepolia resolve → wallet → public JSON + ENS records; no email |
| **Fallback** | Share by `0x` |

### P0.14 Apply UI + 90s ENS demo script

| | |
| --- | --- |
| **Repo** | front + docs |
| **Acceptance** | Script in `ENS_SEPOLIA_V2_CYCLE.md` runs E2E on Sepolia with testnet labeling |
| **Fallback** | Partial honest paths documented |

### P0.15 Mainnet UR readiness (CI)

| | |
| --- | --- |
| **Repo** | `nomadic-front` |
| **Acceptance** | `npm run spike:ens` green |
| **Fallback** | n/a — keep green |

---

## ENS acceptance tests

### Mainnet library (CI)

1. `ur.integration-tests.eth` → `0x2222…2222`  
2. CCIP `test.offchaindemo.eth`  
3. RPC failure handling  

### Sepolia product cycle

1. Mint Passport under `nomadic-passport.eth`  
2. Forward + reverse primary name  
3. Active Passport records change UI  
4. Credential child after World  
5. Credential records reload on Passport  
6. Public `/p/<passport.ens>`  
7. Issuer grant + revoke + revert  

---

## P1

| ID | Task |
| --- | --- |
| P1.1 | contenthash / `com.nomadic.manifest` IPFS snapshot |
| P1.2 | Credential expiry UX + multi-Journey credentials |
| P1.3 | Richer permission inspector |
| P1.4 | Share UX polish; remove obsolete placeholders |

---

## P2 / deferred

| ID | Task |
| --- | --- |
| P2.1 | CCIP-Read dynamic reputation / application status |
| P2.2 | Walrus reference (`com.nomadic.walrus`) |
| P2.3 | Travel stipend to Passport ENS |
| P2.4 | Mainnet Passport namespace (post-hackathon) |

Also deferred: new app/monorepo, Express ENS resolve, deleting legacy features, `DEMO_WORLD_BYPASS`.

---

## Next implementation after this docs pass

**P0.2 — Seed Nomadic Lisbon House Journey + policy presentation UI**, then **P0.7 pin Sepolia ENSv2** before mint UX.  
Canonical ENS cycle: [`ENS_SEPOLIA_V2_CYCLE.md`](./ENS_SEPOLIA_V2_CYCLE.md).

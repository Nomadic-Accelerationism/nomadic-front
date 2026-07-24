# Lisbon Implementation Plan — ETHGlobal Lisbon 2026

> Solo-developer plan. Incremental. No new app. No monorepo.  
> Product: [`LISBON_MVP.md`](./LISBON_MVP.md) · Architecture: [`LISBON_ARCHITECTURE.md`](./LISBON_ARCHITECTURE.md) · Routes: [`LISBON_ROUTES.md`](./LISBON_ROUTES.md).

---

## Principles

- Prefer additive backend changes; do not redesign `UserProofs` / Journey tables.
- Hide legacy demo distractions; do not delete features.
- **Magic wallet spike** before persisting `User.publicAddress`.
- **World readiness spike** before freezing `CredentialClaim` migration field formats.
- ENS: ENSv2-ready via ENSjs + Universal Resolver; no draft ENSv2 registry contracts in P0.
- **No** `DEMO_WORLD_BYPASS`. Local-only test adapters cannot be enabled in preview/production.
- Walrus and direct ENSv2 experimentation only after P0.

---

## Locked build order

```text
1.  P0.1  Passport shell and navigation
2.  P0.2  Magic wallet metadata readiness spike
3.  P0.3  Passport private read API (GET /passport/me)
4.  P0.4  Frontend BFF + real private Passport data
5.  P0.5  ENSv2-ready integration (ENSjs + viem + Universal Resolver)
6.  P0.6  Public Passport route by wallet / ENS alias
7.  P0.7  World SDK + RP signing readiness spike
8.  P0.8  CredentialClaim migration (after World spike)
9.  P0.9  World request, verify, and claim endpoints
10. P0.10 World claim UI + public disclosure
11. P0.11 End-to-end demo + continuity documentation
12. P2+   Walrus or direct ENSv2 experimentation only after P0
```

---

## P0 — Required tasks

### P0.0 Documentation

| | |
| --- | --- |
| **Repository** | `nomadic-front` |
| **Files** | `docs/LISBON_*.md`, `docs/PREEXISTING_VS_LISBON.md` |
| **Dependencies** | none |
| **Acceptance** | Docs reflect ENSv2-ready strategy, World RP route, locked HTTP methods, corrected Selfie Check claims |
| **Demo fallback** | n/a |

---

### P0.1 Passport shell and navigation

| | |
| --- | --- |
| **Repository** | `nomadic-front` |
| **Files likely** | `app/passport/page.tsx`, `components/Passport*.tsx`, `components/HomeUser.tsx`, `components/MenuUserHeader.tsx` |
| **Dependencies** | Existing Magic session |
| **Acceptance** | `/passport` shows session identity + truncated wallet/email; primary CTA to Passport; Journeys/Proofs demoted; placeholder CTA for Nomadic Lisbon 2026 |
| **Demo fallback** | Static shell without APIs |

**Smallest first implementation task after this documentation correction is approved.**

---

### P0.2 Magic wallet metadata readiness spike

| | |
| --- | --- |
| **Repository** | `nomadic-back` (+ light FE observation) |
| **Files likely** | OTP/validate path; spike notes in docs or PR description |
| **Dependencies** | Installed Magic client + Admin SDK versions |
| **Acceptance** | Document real server-validated metadata shape; decide whether `User.publicAddress` can be added; centralize extraction plan; no logging of metadata/DID/email |
| **Demo fallback** | Keep `publicAddress` proposed/null; `WALLET_NOT_BOUND` path documented |

Do **not** add the Prisma field until this spike confirms stability.

---

### P0.3 Passport private read API

| | |
| --- | --- |
| **Repository** | `nomadic-back` |
| **Files likely** | `GET /passport/me` handler |
| **Dependencies** | P0.2 decision (address may still be null) |
| **Acceptance** | Authenticated aggregate returns user id, optional `publicAddress`, credentials list (possibly empty), optional legacy proofs; never required for public email exposure |
| **Demo fallback** | Empty credentials array |

---

### P0.4 Frontend BFF + real private Passport data

| | |
| --- | --- |
| **Repository** | `nomadic-front` |
| **Files likely** | `app/api/passport/me/route.ts`, Passport components |
| **Dependencies** | P0.1, P0.3 |
| **Acceptance** | `GET /api/passport/me` wires `/passport` to Express; auth forwarding works; error mapping matches routes doc |
| **Demo fallback** | Shell session fields if API fails |

---

### P0.5 ENSv2-ready integration (ENSjs + viem)

| | |
| --- | --- |
| **Repository** | `nomadic-front` |
| **Files likely** | `lib/ens.ts` (or similar), Passport identity components, `package.json` / lockfile |
| **Dependencies** | P0.4 wallet address when available; package compatibility check |
| **Package plan** | `@ensdomains/ensjs` ≥ 4.2.3; `viem` ≥ 2.35.0; Mainnet public client; Universal Resolver via library; no Wagmi solely for ENS; no hardcoded draft ENSv2 addresses |
| **Acceptance** | Private Passport reverse+forward verification + avatar; fallbacks work; readiness tests in § ENS acceptance tests pass |
| **Demo fallback** | Truncated wallet on any ENS/RPC failure |

**Pre-install note:** lockfile currently has transitive `viem@2.23.2` via Privy and no `ensjs`. Resolve compatibility before install.

---

### P0.6 Public Passport by wallet / ENS alias

| | |
| --- | --- |
| **Repository** | `nomadic-front` + `nomadic-back` |
| **Files likely** | Express `GET /passport/public/:address`; BFF `GET /api/passport/public/[identifier]`; page `app/p/[identifier]/page.tsx` |
| **Dependencies** | P0.3–P0.5 |
| **Acceptance** | Identifier normalization; ENS name→wallet in FE/BFF; Express receives address only; public page shows credentials without email; 404 works |
| **Demo fallback** | Share by `0x` address if ENS fails |

---

### P0.7 World SDK + RP signing readiness spike

| | |
| --- | --- |
| **Repository** | `nomadic-back` + `nomadic-front` |
| **Files likely** | Spike notes; provisional `POST /world/request` sketch |
| **Dependencies** | World Selfie Check Beta access/docs/SDK |
| **Acceptance** | Confirm IDKit request context shape, verify API, action-scoped uniqueness field; confirm RP signing with action `claim_nomadic_lisbon_2026` and `User.id` signal; no secret logging |
| **Demo fallback** | Honest unavailable path documented |

**Do not freeze CredentialClaim migration before this spike.**

---

### P0.8 CredentialClaim migration

| | |
| --- | --- |
| **Repository** | `nomadic-back` |
| **Files likely** | Prisma schema + migration |
| **Dependencies** | P0.7 |
| **Acceptance** | Table with `@@unique([userId, credentialKey])`, `@@unique([uniquenessKey, credentialKey])`, `@@index([walletAddress])`; no wallet unique; no status |
| **Demo fallback** | n/a |

---

### P0.9 World request, verify, and claim endpoints

| | |
| --- | --- |
| **Repository** | `nomadic-back` (+ FE BFF) |
| **Files likely** | `POST /world/request`, `POST /credentials/claim`, `app/api/world/request`, `app/api/credentials/claim` |
| **Dependencies** | P0.7, P0.8, trusted wallet bind decision from P0.2 |
| **Acceptance** | Full flow per architecture; idempotent 200; 409 conflicts; 503 World down; no selfie/payload storage |
| **Demo fallback** | Recorded demo + local-only adapter |

---

### P0.10 World claim UI + public disclosure

| | |
| --- | --- |
| **Repository** | `nomadic-front` |
| **Files likely** | `app/credentials/lisbon-2026/page.tsx`, claim components |
| **Dependencies** | P0.9 |
| **Acceptance** | Disclosure before claim; IDKit flow; credential appears on `/passport`; idempotent UX; honest unavailable |
| **Demo fallback** | Recorded successful claim |

---

### P0.11 End-to-end demo + continuity documentation

| | |
| --- | --- |
| **Repository** | `nomadic-front` (docs) |
| **Files likely** | Demo script doc if needed; continuity checklist |
| **Dependencies** | P0.1–P0.10 |
| **Acceptance** | Walkthrough matches MVP success criteria including ENS and World failure paths |
| **Demo fallback** | Scripted honest partial demo |

---

## ENS acceptance tests (P0.5)

Document and run these as implementation acceptance checks:

1. **Universal Resolver path**  
   Resolve `ur.integration-tests.eth`  
   Expected: `0x2222222222222222222222222222222222222222`

2. **Forward resolution**  
   ENS name → normalized wallet.

3. **Reverse resolution**  
   Wallet → primary name.

4. **Bidirectional verification**  
   Primary name → original wallet.

5. **Avatar resolution**  
   Valid avatar and absent-avatar states (absent must not fail Passport).

6. **Input handling**  
   `.eth` name; subname; ENS-enabled DNS name; wallet address; malformed name; unresolved name.

7. **RPC failure**  
   Passport still displays wallet fallback.

---

## P1 — Polish

| ID | Task | Repo | Acceptance | Fallback |
| --- | --- | --- | --- | --- |
| P1.1 | Share / copy public URL | front | One-tap copy | Manual URL |
| P1.2 | Empty/loading/error states | front | Clear unbound-wallet UX | Minimal text |
| P1.3 | Collapse legacy proofs | front | Lisbon credential primary | Hide legacy |
| P1.4 | Tighten TS on new Lisbon files | front/back | New code typechecks | Leave legacy ignores |
| P1.5 | Idempotent claim copy | front | Distinct from hard 409 | Generic toast |

---

## P2 — Optional (after P0)

| ID | Task | Notes |
| --- | --- | --- |
| P2.1 | Walrus metadata pin | Only if adds demo value |
| P2.2 | Public journey history | Only with safe public read |
| P2.3 | Evidence-backed community credentials | e.g. organizer-issued ETHGlobal participant |
| P2.4 | Wallet ownership signatures | Enables stronger wallet constraints |
| P2.5 | Direct experimental ENSv2 contracts | Only when official addresses/interfaces/team guidance are ready |

---

## Explicitly deferred

- New app / monorepo / clean rewrite.
- Passport DB entity; ENS DB columns.
- Express ENS resolution.
- Direct draft ENSv2 registry/registrar dependencies in P0.
- Renaming `UserProofs` / Proof enums / Journey models.
- Deleting houses, journeys, NACC, legacy verify UI.
- Multi-wallet account management.
- Social graph, reviews, reputation scores.
- `@@unique([walletAddress, credentialKey])` before ownership proof.
- Deployable World claim bypasses.
- Storing World full payloads / biometrics / selfies.
- Absolute “globally unique human” product claims beyond World’s verified action model.

---

## Smallest first implementation task

**P0.1 — `/passport` shell + demo navigation in `nomadic-front`.**  
No ENS package install, no World, no schema in that first slice.

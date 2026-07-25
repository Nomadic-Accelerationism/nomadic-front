# ENS Sepolia v2 cycle — locked Lisbon decision

> **Decision (2026-07-24):** Lisbon ENS **issuance** uses **Sepolia ENSv2** (`UserRegistry` / `PermissionedRegistry` + `PermissionedResolver`), clearly labeled as testnet.  
> Supersedes the earlier “Option D = resolve-only in the main demo” stance for **mint / credential / permissions**.  
> Track A Universal Resolver readiness on Mainnet remains required for library hygiene; **product identity for the demo is Sepolia**.

## Product sentence

> ENS is not a label on top of Nomadic. It is the ownership and discovery layer of the Passport. Nomadic issues each user a portable namespace, communities issue scoped credential subnames, and the application reads ENS records to reconstruct the user’s identity across sessions.

## Single visible cycle (P0)

```text
Onboarding
→ Nomadic mints Passport ENS (Sepolia)

Journey application
→ World verifies policy (private)

Application succeeds
→ Nomadic mints credential ENS child (Sepolia)

Passport updates
→ Text records drive UI (not hardcoded DB cards alone)

Primary name
→ Wallet ↔ Passport bidirectional check

New session / public page
→ Reconstruct from ENS: name → wallet → Passport records → credential children

Permission demo
→ Grant scoped issuer roles → user revokes → issuer update reverts
```

**Not** the anti-pattern:

```text
Connect wallet → mint random subname → done
```

## Hierarchy (Sepolia)

```text
nomadic-passport.eth          # Nomadic-controlled parent namespace (Sepolia)
└── victor.nomadic-passport.eth
    └── lisbon-house.victor.nomadic-passport.eth
```

| Name | Meaning |
| --- | --- |
| `victor.nomadic-passport.eth` | Portable Passport identity |
| `lisbon-house.victor.nomadic-passport.eth` | Journey credential: **Nomadic Lisbon House — Eligible** |

World verifies the policy. Nomadic creates the credential. ENS makes it ownable, resolvable, and portable.

**UI must always show a Sepolia / testnet badge** near ENS names and tx links.

## Network split

| Concern | Network | Notes |
| --- | --- | --- |
| Passport / credential mint, roles, revoke | **Sepolia ENSv2** | UserRegistry / PermissionedRegistry / PermissionedResolver |
| Resolve demo names in app | **Sepolia** public client + Universal Resolver | Same UR address family `0xeEeE…EeEe` on testnets |
| Library readiness probe `ur.integration-tests.eth` | **Mainnet** (CI / spike) | Keeps ensjs/viem ENSv2-ready; not the product namespace |
| Backend identity key | Wallet `0x…` | Express stays address-keyed |
| Product identity | Passport ENS name | Shown everywhere after onboarding |

## Contract stance

Use **standard ENSv2 factories** confirmed by the ENS team for the current Sepolia deployment:

- Parent namespace registry under Nomadic control  
- Per-Passport **UserRegistry** (or PermissionedRegistry) for credential children  
- **PermissionedResolver** for Passport + credential text records  
- Scoped issuer roles on credential resources only  

**Do not** invent a custom registry unless allowlisted labels / auto-revoke-on-transfer cannot be expressed (see [ENSV2_PERMISSION_MODEL.md](./ENSV2_PERMISSION_MODEL.md)).

Sepolia v2 addresses **rotate** (ensjs / contracts-v2 deployment bumps). Pin the deployment used for Lisbon in env (names only in docs):

```text
ENS_SEPOLIA_ETH_REGISTRY=
ENS_SEPOLIA_VERIFIABLE_FACTORY=
ENS_SEPOLIA_USER_REGISTRY_IMPL=
ENS_SEPOLIA_PERMISSIONED_RESOLVER_IMPL=
ENS_SEPOLIA_UNIVERSAL_RESOLVER=0xeEeEEEeE14D718C2B47D9923Deab1335E144EeEe
ENS_SEPOLIA_PARENT_NAME=nomadic-passport.eth
```

Published `@ensdomains/ensjs@4.3.1` consts still emphasize legacy Sepolia registry addresses for some keys — **issuance code must use the pinned ENSv2 deployment**, not assume NameWrapper-only paths.

## Active text records (drive UI)

### Passport (`victor.nomadic-passport.eth`)

```text
addr
avatar
url
description
com.nomadic.type            = passport
com.nomadic.profile         = https://…/p/victor.nomadic-passport.eth
com.nomadic.currentJourney  = lisbon-house-2026
com.nomadic.credentialCount = <n>
com.nomadic.skills          = …          # optional demo
com.nomadic.manifest        = ipfs://…   # P1
```

### Credential (`lisbon-house.victor.nomadic-passport.eth`)

```text
com.nomadic.type       = journey-eligibility
com.nomadic.issuer     = nomadic-lisbon-house
com.nomadic.journey    = lisbon-house-2026
com.nomadic.policy     = lisbon_house_policy_v1
com.nomadic.status     = eligible
com.nomadic.issuedAt   = <iso>
com.nomadic.expiresAt  = <iso>
com.nomadic.credential = https://…/credentials/…
```

Frontend **must** read these records to render Passport / credential cards after issuance (reload discovers from ENS).

### Never write on ENS

```text
age, DOB, nationality, issuing country, document number,
World nullifier, session_id, raw Identity Check payloads
```

Public result only: `policy` + `status` (+ journey/issuer ids).

## Permissions (P0 demo)

User controls Passport. Lisbon House issuer may update **only** scoped credential records, e.g.:

```text
com.nomadic.status
com.nomadic.issuedAt
com.nomadic.expiresAt
com.nomadic.credential
```

Issuer must **not** transfer Passport, change `addr`/`avatar`, replace Passport resolver/subregistry, or mint other communities’ children.

### Four visible transactions

1. Passport issued to user  
2. Credential child created  
3. Lisbon House receives scoped record permission  
4. User revokes Lisbon House permission → issuer update **reverts**

## Primary name

After mint:

1. Passport name → wallet (`addr`)  
2. Wallet sets Passport as Sepolia primary name  
3. Nomadic verifies forward + reverse  
4. UI shows ENS everywhere; fallback to truncated wallet if check fails  

## 90-second demo script

1. **Onboarding** — “Victor does not need an existing ENS name.” → Create Nomadic Passport → mint `victor.nomadic-passport.eth` (Sepolia badge).  
2. **Primary identity** — show name↔address both ways.  
3. **Journey** — open Nomadic Lisbon House + policy.  
4. **World** — Identity + Selfie; backend: policy satisfied.  
5. **Credential** — mint `lisbon-house.victor.nomadic-passport.eth`; show tx, owner, resolver, records, expiry.  
6. **Records alter UI** — reload Passport; credential discovered from ENS.  
7. **Continuity** — `/p/victor.nomadic-passport.eth` in fresh session.  
8. **Revoke** — user revokes issuer; house update fails.

## Phase table (revised)

### ENS P0 (Sepolia issuance + app read path)

- Programmatic Passport subname on onboarding  
- Passport ENS as visible product identity  
- Forward + reverse / primary name  
- Active text records driving UI  
- Credential child after World success  
- App reconstructs from ENS on reload / public page  
- Scoped issuer permission + revoke demo  
- Real Sepolia tx hashes / contract links  
- Mainnet UR readiness still in CI (`npm run spike:ens`)

### ENS P1

- `contenthash` or `com.nomadic.manifest` → IPFS Passport snapshot  
- Credential expiry UX + renew  
- Multiple Journey credentials  
- Richer permission inspector  

### ENS P2

- CCIP-Read dynamic reputation / application status  
- L2 records  
- Travel stipend to Passport ENS  
- Walrus reference (`com.nomadic.walrus`, not fake contenthash)  
- Multi-chain addresses  

## Implementation boundaries

| Do | Don’t |
| --- | --- |
| Label every ENS surface “Sepolia / testnet” | Imply mainnet Passport ownership in Lisbon demo |
| Keep Express keyed by wallet | Put ENS resolution in Express for P0 |
| Gate credential mint on World verify success | Mint credential without verification session |
| Isolate mint adapters under clear Sepolia config | Make Mainnet Passport UI depend on rotating Sepolia addresses without pin |
| Show revoke revert live | Only claim “ACL supported” in docs |

## Relation to prior spikes

| Doc | Status |
| --- | --- |
| [ENS_STABLE_INTEGRATION_SPIKE.md](./ENS_STABLE_INTEGRATION_SPIKE.md) | Still valid for **readiness libraries** (Mainnet UR/CCIP probes) |
| [ENSV2_PASSPORT_ARCHITECTURE.md](./ENSV2_PASSPORT_ARCHITECTURE.md) | Hierarchy model — parent name locked to `nomadic-passport.eth` on Sepolia |
| [ENSV2_PERMISSION_MODEL.md](./ENSV2_PERMISSION_MODEL.md) | Roles — execute as P0 demo txs |
| [ENSV2_IMPLEMENTATION_OPTIONS.md](./ENSV2_IMPLEMENTATION_OPTIONS.md) | **Lisbon chooses Sepolia ENSv2 issuance** (see update there) |

## Blockers before code mint

1. Confirm current Sepolia ENSv2 deployment addresses with ENS team; pin in env.  
2. Register / control `nomadic-passport.eth` (or temporary Sepolia parent) on that deployment.  
3. World spike E2E still gates “policy satisfied” before credential child mint.  
4. `nomadic-back` access for verify → mint orchestration (front can hold Sepolia wallet ops if back unavailable).

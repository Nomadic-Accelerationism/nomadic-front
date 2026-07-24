# ENSv2 Passport architecture spike (Track B)

> Conceptual / architecture only. **Do not** mint production names or make Passport depend on experimental ENSv2 registry writes.  
> Based on official ENSv2 overview + PermissionedRegistry / PermissionedResolver docs; Sepolia/devnet deployments exist and **addresses rotate** — treat write-path prototypes as isolated.

## Desired product model

```text
Passport identity
└── Journey credential subname
```

Example:

```text
victor.<nomadic-namespace>
└── lisbon-house.victor.<nomadic-namespace>
```

- Passport owner retains control of the **parent** identity.  
- Community / Journey issuer receives **minimum** authority to issue **only** its credential child.  
- Public records stay non-sensitive.

## Confirmed ENSv2 building blocks (docs)

| Building block | Role for Nomadic |
| --- | --- |
| Hierarchical registries | Each name can have its own **subregistry** for direct children |
| `PermissionedRegistry` | Tokenized (ERC-1155) names + role bitmap + **expiry** |
| Registry factories (`IRegistryFactory` / VerifiableFactory / UserRegistry impl) | Deterministic per-user / per-passport registries |
| `PermissionedResolver` | Per-name (or aliased) resolver with **resource-scoped** record roles |
| Universal Resolver proxy `0xeEeE…EeEe` | Canonical **read** entrypoint (Track A already green) |
| Resolvers interface continuity | ENSv1 resolvers continue to work; clients resolve via UR |

**Important docs facts:**

- A registry is responsible for **one level** (a name + its **direct** children), not grandchildren.  
- Transfer of a parent can **replace the entire subregistry subtree** in one operation.  
- On transfer, roles granted to the **previous owner** move to the new owner; roles granted to **other accounts survive** — trading UIs must audit external roles.  
- ENSv2 write deployments observed on **Sepolia / devnet**; mainnet hierarchical Passport issuance is **not** assumed production-ready for Lisbon demo.

## Target on-chain structure

```text
Root / TLD (ENS-controlled)
└── <nomadic-namespace>          # Nomadic parent namespace registry
    └── victor                   # Passport subname (user-owned token)
        ├── resolver             # Passport public records
        └── subregistry          # Passport-owned registry for credentials
            └── lisbon-house     # Journey credential subname
                ├── resolver     # Credential public records (or inherit)
                └── expiry       # Credential validity window
```

### 1. Nomadic parent namespace

- Platform provisions / maintains the Nomadic TLD-like namespace (exact label TBD with ENS team: e.g. `nomadic.eth` or partner DNS).  
- After handoff of a Passport name, platform **must not** retain unrestricted `ROLE_SET_RESOLVER` / `ROLE_SET_SUBREGISTRY` / admin roles on that Passport resource.  
- Platform may keep **narrow** `ROLE_REGISTRAR` on the **parent namespace registry only** to mint new Passport labels — not to edit existing Passports.

### 2. User Passport subname

- Registered to the user’s wallet as ERC-1155 owner.  
- User receives roles needed to control resolver + credential subregistry (`ROLE_SET_RESOLVER`, `ROLE_SET_SUBREGISTRY`, renew/unregister as product allows).  
- Optional emancipation pattern: revoke platform roles on the Passport resource after mint (ENSv2 analogue of Name Wrapper emancipation).

### 3. Child credential subname

- Created under the Passport’s **own** subregistry: `lisbon-house.victor.<ns>`.  
- Owner: preferably the **user** (Passport owner), with issuer holding **only** registrar or text/addr write roles for that label — see permission model doc.  
- Alternative (issuer-owned credential token): weaker user ownership; **not preferred**.

### 4. Passport resolver records (public, non-sensitive)

Suggested text keys (illustrative — finalize with ENSIP text conventions):

| Key | Content |
| --- | --- |
| `url` / `nomadic.passport` | Public Passport URL |
| `avatar` | Optional |
| `nomadic.type` | `passport` |
| `nomadic.version` | schema version |

### 5. Credential resolver (dedicated or inherited)

| Approach | Pros | Cons |
| --- | --- | --- |
| **Dedicated resolver** per credential | Clean permissions; issuer can be granted `ROLE_SET_TEXT` only on that node | More deployments / gas |
| **Inherited / parent resolver** with aliasing | Fewer contracts | Harder to scope issuer writes |

**Recommendation:** dedicated `PermissionedResolver` (or factory clone) per Passport, with **resource-scoped** text permissions for credential nodes when using a shared resolver; otherwise one resolver per credential subname for clearest isolation.

Credential public records only:

| Key | Content |
| --- | --- |
| `nomadic.credential` | e.g. `NOMADIC_LISBON_HOUSE_ELIGIBLE` |
| `nomadic.issuer` | issuer id / address (public) |
| `nomadic.journey` | Journey id |
| `nomadic.policy` | `lisbon_house_policy_v1` |
| `nomadic.issued` | ISO / unix |
| `nomadic.expires` | ISO / unix |
| `nomadic.revoked` | `false` / `true` or status URI |
| `nomadic.meta` | hash / URI of **public** metadata |

### Never store on ENS

- age, country, document data  
- World proofs, nullifiers  
- legal identity, email, biometrics  

World results stay in Nomadic `VerificationSession` / backend minimization model.

## 6–12. Capability answers (architecture)

| # | Topic | Finding |
| --- | --- | --- |
| 6 | Scoped community issuer permissions | **Yes, in standard model:** grant issuer `ROLE_REGISTRAR` only on Passport subregistry **or** `ROLE_SET_TEXT` on credential resolver resource; do **not** grant Passport `ROLE_SET_RESOLVER` / `ROLE_SET_SUBREGISTRY` |
| 7 | Parent ownership retained by user | **Yes:** user owns Passport token; issuer has no parent admin roles |
| 8 | Credential expiry | **Yes:** `PermissionedRegistry.register(..., expiry)`; `renew` requires `ROLE_RENEW` |
| 9 | Credential revocation | **Options:** (a) `unregister` with `ROLE_UNREGISTER`; (b) set `nomadic.revoked` text; (c) replace resolver data; prefer explicit status + expiry |
| 10 | Transfer behaviour | Parent transfer can replace **entire credential subtree** if new owner swaps subregistry — product must document this |
| 11 | External roles after transfer | **Survive** unless revoked — issuer roles persist across Passport trades unless Nomadic policy revokes on transfer |
| 12 | Universal Resolver compatibility | **Read path already compatible** (Track A). Issued names must remain resolvable via Mainnet UR + CCIP if records live offchain/L2 |

## Custom contract?

**Default: no custom registry.**  
Standard `PermissionedRegistry` + factory + `PermissionedResolver` roles appear sufficient to express:

- user-owned Passport  
- issuer-limited credential issuance  
- expiry / unregister  
- emancipated parent  

**Propose a thin custom issuer controller only if** ENS team confirms Sepolia factories cannot:

- constrain registrar to a **label allowlist** (`lisbon-house` only), or  
- auto-revoke issuer roles on Passport transfer, or  
- bind credential metadata immutably without resolver write races.

Any such controller would be an **isolated prototype**, never a Passport runtime dependency for Lisbon P0.

## Isolation rule

```text
Track A (stable resolve)     → may feed Passport display
Track B (ENSv2 hierarchy)    → docs + optional future /spikes/ensv2 only
Main demo Passport           → must not import Track B writes
```

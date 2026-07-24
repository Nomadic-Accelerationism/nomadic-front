# ENSv2 permission model spike — Nomadic Passport

> Maps Nomadic roles onto **documented** ENSv2 `PermissionedRegistry` / `PermissionedResolver` roles.  
> **Lisbon:** execute this model on **Sepolia** as a P0 demo (four visible txs + revoke revert).  
> Addresses rotate — pin deployment in env; see [ENS_SEPOLIA_V2_CYCLE.md](./ENS_SEPOLIA_V2_CYCLE.md).

## Actors

| Actor | Intent |
| --- | --- |
| **Passport owner** | Controls Passport name, resolver, sharing; can revoke issuer authority where supported |
| **Nomadic platform** | May provision Passport namespaces; **no** unrestricted control after handoff |
| **Journey issuer** | Issues only its scoped credential; cannot edit Passport identity or other issuers’ credentials; never sees private World results |

## Registry roles used (PermissionedRegistry)

From `RegistryRolesLib` (docs):

| Role | Scope | Nomadic use |
| --- | --- | --- |
| `ROLE_REGISTRAR` | Root-only (per registry) | Mint child labels (Passports under namespace; credentials under Passport) |
| `ROLE_REGISTRAR_ADMIN` | Root-only | Who may grant/revoke registrar — keep tightly held |
| `ROLE_SET_RESOLVER` | Root or token | Point name at resolver |
| `ROLE_SET_SUBREGISTRY` | Root or token | Attach child registry (Passport → credentials) |
| `ROLE_RENEW` | Root or token | Extend expiry |
| `ROLE_UNREGISTER` | Root or token | Burn / clear registration (revocation path) |
| `ROLE_CAN_TRANSFER_ADMIN` | Token | Gate transfers |
| `ROLE_SET_PARENT` | Root-only | Wire registry into hierarchy (platform ops) |

Admin counterparts (`*_ADMIN`) grant/revoke the base role. Docs note admin roles are constrained against privilege escalation after registration.

## Resolver roles used (PermissionedResolver)

| Role | Nomadic use |
| --- | --- |
| `ROLE_SET_TEXT` | Public Passport / credential metadata keys only |
| `ROLE_SET_ADDR` | Optional wallet / coin address records |
| `ROLE_SET_CONTENTHASH` | Optional contenthash to public metadata |
| `ROLE_CLEAR` | Owner cleanup |
| Per-text-key resources | Grant issuer write on **specific** keys (`nomadic.credential`, …) without full text power |

## Role matrix

### Passport owner

| Capability | Mechanism |
| --- | --- |
| Own Passport name | ERC-1155 owner of Passport token |
| Control Passport resolver | `ROLE_SET_RESOLVER` (+ admin) on Passport resource |
| Control credential subregistry | `ROLE_SET_SUBREGISTRY` on Passport; owns Passport subregistry root roles as designed |
| Share / transfer | Transfer token if `ROLE_CAN_TRANSFER_ADMIN` allows; document subtree risk |
| Revoke issuer authority | `revokeRoles` on Passport subregistry root (`ROLE_REGISTRAR` from issuer) and/or resolver text roles; optionally `unregister` credential |

### Nomadic platform

| Capability | Mechanism | Constraint |
| --- | --- | --- |
| Provision namespace | Own Nomadic parent registry; hold `ROLE_REGISTRAR` there | Do not keep Passport-level admin after handoff |
| Mint Passport label | `register(victor, user, passportSubregistry, passportResolver, userRoleBitmap, expiry)` | Immediately drop platform roles on that token resource |
| Upgrade factories / impl | Ops-only on platform-owned contracts | Never upgrade user Passport registry without consent model |

**After handoff checklist:** platform should **not** retain on the Passport resource:

- `ROLE_SET_RESOLVER` / `_ADMIN`  
- `ROLE_SET_SUBREGISTRY` / `_ADMIN`  
- `ROLE_UNREGISTER` / `_ADMIN` (unless explicit recovery policy)  
- Resolver `ROLE_SET_*` for Passport node  

Platform may retain **namespace-level** registrar to create *new* Passports only.

### Journey issuer (e.g. Lisbon House)

| Capability | Allowed? | Mechanism |
| --- | --- | --- |
| Issue `lisbon-house` credential under user Passport | Yes | Preferred: Passport owner (or Nomadic UX with user signature) calls `register` on Passport subregistry **or** issuer holds `ROLE_REGISTRAR` on that subregistry with offchain policy limiting labels |
| Modify Passport identity records | **No** | Never grant Passport resolver roles |
| Modify other issuers’ credentials | **No** | No roles on other labels; no root `ROLE_SET_RESOLVER` on Passport |
| Read private World results | **No** | Off-chain only; ENS holds public hashes/status |
| Renew / expire credential | Optional | `ROLE_RENEW` / rely on expiry; product choice |
| Revoke credential | Optional | Issuer `ROLE_UNREGISTER` **or** owner-only revoke — prefer **owner + issuer dual-control** documented in UX |

#### Label allowlisting gap

Standard `ROLE_REGISTRAR` can register **any** available label on that registry. To restrict an issuer to `lisbon-house` only:

1. **Offchain policy + user-signed mint** (no issuer registrar) — strongest ownership, less “issuer autonomy”.  
2. **Issuer controller contract** holding registrar that allowlists labels — thin custom contract (only if factories cannot express this).  
3. **Pre-create reserved label** then issuer completes reservation (`ROLE_REGISTER_RESERVED`) — possible pattern; confirm with ENS team.

Spike stance: prefer (1) for Lisbon demo honesty; document (2) as Track B experiment if bounty depth requires on-chain issuer autonomy.

## Permission experiment — recommended wiring

```text
Nomadic namespace registry
  ROLE_REGISTRAR: Nomadic platform (mint Passports only)

Passport token (victor)
  owner: user
  roles: SET_RESOLVER, SET_SUBREGISTRY, RENEW, UNREGISTER (+ admins as needed)
  platform roles: none after handoff

Passport subregistry (credentials)
  owner/admin: user
  ROLE_REGISTRAR: user (and optionally allowlisted issuer controller)
  issuer: NO SET_SUBREGISTRY, NO parent Passport roles

Credential label (lisbon-house)
  owner: user
  expiry: set
  resolver text writes: user; optional issuer ROLE_SET_TEXT on nomadic.* keys only
```

## Transfer behaviour (must disclose in product)

| Event | Effect |
| --- | --- |
| Passport token transfer | Owner roles move to new owner; **external issuer roles remain** until revoked |
| New owner replaces subregistry | Prior credential subtree **disappears** from resolution path |
| Credential token transfer | Same external-role persistence rule at credential level |

Nomadic apps that facilitate transfers **must** surface outstanding issuer roles (ENS docs requirement).

## Custom registry?

**Not required** for the core owner / platform / issuer separation above.  
**Optional thin issuer controller** only for on-chain label allowlists or auto-revoke-on-transfer.

## World boundary

ENS permissions never grant access to World Identity/Selfie payloads. Issuers consume Nomadic’s sanitized eligibility credential issuance API, then write **public** ENS records only.

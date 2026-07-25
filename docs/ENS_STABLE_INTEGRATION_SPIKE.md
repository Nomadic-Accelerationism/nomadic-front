# ENS stable integration spike (Track A)

> Status: **executed on Mainnet** with `@ensdomains/ensjs@4.3.1` + `viem@2.43.0`.  
> Scope: ENSv2-**ready application resolution** only. No name minting. No experimental registry dependency on Passport.  
> Sources: [Preparing for ENSv2](https://docs.ens.domains/web/ensv2-readiness/), [Universal Resolver](https://docs.ens.domains/resolvers/universal/), ENSjs package contracts.

## Package / Privy compatibility

### Before this spike

| Package | Version in lockfile |
| --- | --- |
| `@privy-io/react-auth` | `2.4.4` |
| Transitive `viem` | **`2.23.2`** (via Privy) |
| `@ensdomains/ensjs` | not installed |

### Official ENSv2 readiness minima

| Library | Required |
| --- | --- |
| `viem` | **≥ 2.35.0** |
| `@ensdomains/ensjs` | **≥ 4.2.3** |

### Exact versions installed for this spike

| Package | Installed | Rationale |
| --- | --- | --- |
| `viem` | **`2.43.0`** (direct) | Meets ≥2.35; stable mid-line of current 2.x; peer of ensjs `^2.35.0` |
| `@ensdomains/ensjs` | **`4.3.1`** | Latest 4.x with Universal Resolver `0xeEeE…EeEe` |
| Privy nested `viem` | **deduped to 2.43.0** after direct install | Privy’s declared range is `^2.21.9` — 2.43 satisfies it |

### Proposed compatible sets (before / for production)

| Option | Packages | Notes |
| --- | --- | --- |
| **A (chosen for spike)** | `viem@2.43.0` + `@ensdomains/ensjs@4.3.1` + keep Privy `2.4.4` | Works today; npm deduped Privy onto 2.43 |
| **B (newer)** | `viem@2.55.x` + `ensjs@4.3.1` + upgrade Privy toward `3.35.x` (ships `viem@2.55.5`) | Cleaner long-term; **Privy major upgrade is out of spike scope** — regression-test Magic/wallet flows first |
| **C (minimum)** | `viem@2.35.0` + `ensjs@4.2.3` | Meets docs floor; prefer 4.3.1 for UR ABI fixes |

**Recommendation:** keep **Option A** for Lisbon Passport resolve/display. Do **not** force Privy 3.x in this spike. Re-verify wallet proofs after any Privy upgrade.

**Do not** use Wagmi solely for ENS.

## Canonical contracts / client

| Item | Value |
| --- | --- |
| Chain | Ethereum **Mainnet** public client |
| Universal Resolver | `0xeEeEEEeE14D718C2B47D9923Deab1335E144EeEe` (DAO-owned proxy; ENSv2-ready) |
| Library wiring | `addEnsContracts(mainnet)` from `@ensdomains/ensjs` |
| RPC used in spike | `https://ethereum.publicnode.com` (override via `ENS_SPIKE_RPC_URL`) |

## Prototype locations (isolated)

| Path | Role |
| --- | --- |
| `lib/spikes/ens/*` | Client + forward/reverse/avatar/display helpers |
| `app/api/spikes/ens/resolve` | Read-only `GET ?q=` |
| `scripts/ens-spike-test.mjs` | Official vectors + matrix (`npm run spike:ens`) |

Passport production UI **must not** import experimental ENSv2 write paths. Track A helpers are resolution-only.

## Capability confirmation

| Capability | Status | Notes |
| --- | --- | --- |
| Forward resolution | **Confirmed** | `getAddressRecord` via Universal Resolver |
| Reverse resolution | **Confirmed** | `getName` |
| Bidirectional primary-name verification | **Confirmed** | Require library `match` + forward re-check |
| Avatar | **Confirmed** | `getTextRecord(..., 'avatar')` |
| CCIP Read | **Confirmed** | `test.offchaindemo.eth` vector passed |
| DNS names imported into ENS | **Confirmed** | `ensfairy.xyz`, `ses.fkey.id` |
| Fallback to wallet | **Confirmed (logic)** | Display helper returns wallet; drops unverified primary |

## Required test results (executed)

Command: `npm run spike:ens`

| Test | Expected | Result |
| --- | --- | --- |
| `ur.integration-tests.eth` | `0x2222…2222` | **PASS** |
| (legacy wrong path) | would be `0x1111…1111` | Not observed |
| `test.offchaindemo.eth` | `0x779981590E7Ccc0CFAe8040Ce7151324747cDb97` | **PASS** |
| `.eth` (`vitalik.eth`) | resolves | **PASS** |
| Subname (`1.offchaindemo.eth`) | resolves | **PASS** |
| Imported DNS (`ensfairy.xyz`) | resolves | **PASS** |
| Address input | checksum + reverse optional | Covered by helpers |
| Malformed / no-dot | not treated as ENS | **PASS** |
| Unresolved name | `null` address | **PASS** |
| RPC failure | hard error, no fake success | **PASS** |
| Bidirectional `nick.eth` | match true | **PASS** |
| Avatar `nick.eth` | non-empty text | **PASS** |

## Name detection rule

**Incorrect:** `endsWith('.eth')` only.  
**Correct (ENS docs):** any dot-separated string with length > 2 is a potential ENS name (covers DNS imports and emoji domains).

## Architecture for Nomadic Passport (stable path)

```text
User input (ENS or 0x…)
  → Next.js BFF / spike resolve (Mainnet + Universal Resolver)
  → wallet address
  → Express public Passport by address only
  → FE shows ENS alias + avatar only if bidirectional match
```

Express (`nomadic-back`) still **must not** resolve ENS in P0.

## Out of scope for *this* Track A spike

- Minting (moved to Sepolia ENSv2 cycle — not Mainnet)  
- Storing ENS columns in Prisma  

**Follow-on (locked):** Lisbon **issues** Passports/credentials on **Sepolia ENSv2**. See [ENS_SEPOLIA_V2_CYCLE.md](./ENS_SEPOLIA_V2_CYCLE.md). Track A remains the Mainnet readiness + resolve-pattern foundation.

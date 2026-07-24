# ENSv2 implementation options — Nomadic Lisbon

> Compare paths for ENS in Nomadic. Spike recommendation at the bottom.  
> Track A readiness tests already **PASS** (`npm run spike:ens`).

## Options

### Option A — Stable ENS resolution only

**What:** Mainnet Universal Resolver via `@ensdomains/ensjs` ≥ 4.2.3 + `viem` ≥ 2.35. Display primary name, avatar, bidirectional verify, DNS+CCIP. Wallet remains canonical backend key.

| Dimension | Assessment |
| --- | --- |
| Demo reliability | **Highest** — already green |
| Bounty technical depth | Low–medium (correct readiness, not novel hierarchy) |
| User ownership | Alias display only; no Passport/credential names |
| Time | Small |
| Unfinished-contract risk | **None** |

### Option B — ENSv1-compatible subnames with stable contracts

**What:** Issue subnames under a Nomadic `.eth` (or DNS) using ENSv1 NameWrapper / classic registrar patterns; resolvers on PublicResolver; still resolve via new Universal Resolver.

| Dimension | Assessment |
| --- | --- |
| Demo reliability | High if name inventory exists |
| Bounty depth | Medium — real subnames, weaker scoped issuer story |
| User ownership | Possible with wrapper fuses/emancipation |
| Time | Medium (ops + gas + UX) |
| Unfinished-contract risk | Low (mature v1) |
| Fit to “Passport → credential child” | Awkward: flat-ish wrapper model vs true hierarchy |

### Option C — Direct ENSv2 hierarchical registry prototype

**What:** Deploy/use Sepolia (or confirmed) `PermissionedRegistry` factories to mint `victor.<ns>` + `lisbon-house.victor.<ns>` with issuer roles.

| Dimension | Assessment |
| --- | --- |
| Demo reliability | **Lowest** for main path — Sepolia address churn (e.g. 20260630 bumps); not mainnet-stable for Lisbon visitors |
| Bounty depth | **Highest** |
| User ownership | Best conceptual match |
| Time | High (factory wiring, roles, UX, UR checks on testnet) |
| Unfinished-contract risk | **High** |

### Option D — Stable core + isolated ENSv2 advanced prototype

**What:**

1. **Production/demo Passport** uses Track A only (Option A).  
2. **Isolated** `/spikes/ensv2` (future) or docs-only Track B models hierarchy + permissions — **not** imported by Passport runtime.  
3. Optional later: Sepolia mint demo behind explicit spike flag.

| Dimension | Assessment |
| --- | --- |
| Demo reliability | **High** (core path = A) |
| Bounty depth | **High** if Track B architecture + permission experiment are presented; optional live Sepolia add-on |
| User ownership | Documented ENSv2 path preserves user parent control |
| Time | Fits hackathon: ship resolve now; architecture spike done |
| Unfinished-contract risk | Contained — experimental code cannot break Passport |

---

## Recommendation

### **Option D**

Matches ENS team guidance (“update libraries / Universal Resolver”) for app readiness, while reserving hierarchical Passport+credential design for an **isolated** advanced track until deployments and interfaces are confirmed stable enough for a live mint demo.

**Do not** choose Option C as the main Nomadic demo dependency.  
**Do not** skip Option A’s readiness vectors.

### Lisbon sequencing

1. Wire Track A helpers into Passport display / public `/p/[identifier]` (implementation task — not this spike’s production merge of experimental code).  
2. Keep Express address-only.  
3. Present Track B architecture + permission model for bounty judges / ENS conversations.  
4. Only after ENS team confirms current Sepolia/mainnet factory stability: optional gated mint prototype under `/spikes/ensv2`.

### Explicit non-goals (this spike)

- Minting production names  
- Deploying unreviewed custom registries  
- Making Passport import experimental ENSv2 write SDKs  

## Package freeze (Track A)

| Package | Version |
| --- | --- |
| `@ensdomains/ensjs` | **4.3.1** |
| `viem` | **2.43.0** |
| Universal Resolver | `0xeEeEEEeE14D718C2B47D9923Deab1335E144EeEe` |

Privy remains `2.4.4`; transitive viem deduped to 2.43.0. Re-test wallet flows if upgrading Privy to 3.x.

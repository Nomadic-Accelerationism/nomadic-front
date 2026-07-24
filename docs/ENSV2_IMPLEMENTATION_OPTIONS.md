# ENSv2 implementation options — Nomadic Lisbon

> Track A readiness tests still **PASS** (`npm run spike:ens` on Mainnet).  
> **Lisbon issuance decision (locked):** Sepolia ENSv2 UserRegistry / PermissionedRegistry — see [ENS_SEPOLIA_V2_CYCLE.md](./ENS_SEPOLIA_V2_CYCLE.md).

## Options (historical)

### Option A — Stable ENS resolution only

Resolve/display via Universal Resolver. No mint. Highest reliability, lowest ENS bounty depth.

### Option B — ENSv1-compatible subnames (stable contracts)

NameWrapper / classic subnames under owned parent. Reliable, weaker hierarchical ACL story.

### Option C — Direct ENSv2 hierarchical registry prototype

UserRegistry / PermissionedRegistry mint + roles. Highest depth; deployment churn risk.

### Option D — Stable core + isolated ENSv2 advanced prototype

Main demo resolve-only; hierarchy docs/spike isolated. Previous spike default.

---

## Locked Lisbon choice

### **Sepolia ENSv2 issuance in the main demo cycle** (Option C on **testnet**, with Option A library readiness retained)

| Dimension | Choice |
| --- | --- |
| Demo reliability | Accept Sepolia + explicit **testnet** labeling; pin deployment addresses |
| Bounty technical depth | Hierarchical Passport → credential child + scoped revoke |
| User ownership | User owns Passport registry; issuer limited to credential records |
| Time | Large — mint + World + records UI + revoke in one narrative |
| Unfinished-contract risk | Contained to Sepolia; Mainnet Passport product claims deferred |

**Not chosen for Lisbon issuance:** pure Option A/D (resolve-only main demo), mainnet ENSv1-only mint without hierarchical roles.

### What still comes from Option A / Track A

- `@ensdomains/ensjs` ≥ 4.2.3 + `viem` ≥ 2.35  
- Mainnet CI probe: `ur.integration-tests.eth` → `0x2222…2222`  
- Bidirectional primary-name verification patterns  
- Never `endsWith('.eth')` alone for name detection  

### What ships in the 90s demo (Sepolia)

```text
Mint Passport → World → mint credential child → records drive UI
→ primary name → /p/<passport.ens> → revoke issuer → revert
```

Details: [ENS_SEPOLIA_V2_CYCLE.md](./ENS_SEPOLIA_V2_CYCLE.md).

## Package freeze (read path)

| Package | Version |
| --- | --- |
| `@ensdomains/ensjs` | **4.3.1** |
| `viem` | **2.43.0** |
| Universal Resolver | `0xeEeEEEeE14D718C2B47D9923Deab1335E144EeEe` |

Issuance ABIs/addresses: pin Sepolia ENSv2 deployment separately (may be ahead of ensjs `consts` until upstream bumps).

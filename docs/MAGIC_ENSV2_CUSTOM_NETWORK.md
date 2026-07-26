# Magic custom network for ENSv2 (Sepolia)

Working architecture for Nomadic Passport ENSv2 stages on Sepolia.
Do **not** redesign this wallet path.

## Why a custom network (not `network: "sepolia"`)

Magic’s built-in `network: "sepolia"` can change the derived address set.

This product must keep the **mainnet-mapped** Magic Passport owner:

```text
0xd114FA765bA4811219AAe364c93CE8A81Ad39B17
```

Therefore Magic is initialized once with a **custom network**:

```ts
new Magic(publishableKey, {
  network: {
    rpcUrl: `${origin}/api/ens/sepolia-rpc`,
    chainId: 11155111,
  },
});
```

Rules:

- Use **one** Magicsdk 28.x custom-network singleton in the ENS execution flow.
- Do **not** use `network: "sepolia"`.
- Do **not** create a second competing Magic instance on the Stage page.
- Do **not** call `wallet_switchEthereumChain` / `wallet_addEthereumChain`.
- Do **not** use `eth_sign` / `eth_signTransaction` / private-key export.
- Do **not** migrate this path to Privy or EIP-7702.
- Broadcast with **`eth_sendTransaction` only**.

Implementation: `lib/magic/sepolia-singleton.ts`.

## Server-only dRPC proxy

```text
Browser / Magic iframe
  → POST {origin}/api/ens/sepolia-rpc
  → server fetch(ENS_SEPOLIA_RPC_URL)   // dRPC, never NEXT_PUBLIC_*
```

| Item | Rule |
| --- | --- |
| `ENS_SEPOLIA_RPC_URL` | Server-only env on Vercel |
| Browser | Never receives the dRPC URL or key |
| Proxy routes | `POST` + `OPTIONS` `/api/ens/sepolia-rpc` |
| CORS | Reflect Magic iframe `Origin` (e.g. `https://auth.magic.link`) |
| Responses | JSON-RPC bodies, prefer HTTP 200, `Cache-Control: no-store` |
| Logging | Method + safe `eth_sendRawTransaction` summary only — never raw signed tx bytes, never upstream URL/key |

Public keyless RPC may be used for **page reads** / receipt verification only:

```text
https://ethereum-sepolia-rpc.publicnode.com
```

## Magic Dashboard setup (required)

### 1. Allowed Origins & Redirects

Add the production app URL, e.g.:

```text
https://nomadic-front-rosy.vercel.app
```

### 2. CSP / `connect-src` (separate from Allowed Origins)

**Allowed Origins is not sufficient for a Magic custom RPC.**

Also add the production origin / custom RPC origin to Magic Dashboard
**CSP → `connect-src`**, so the Magics iframe may call:

```text
https://nomadic-front-rosy.vercel.app
https://nomadic-front-rosy.vercel.app/api/ens/sepolia-rpc
```

### 3. After CSP changes

CSP updates may require a **fresh Magic iframe/session**:

1. Close old tabs that loaded Magic before the CSP change.
2. Open a new tab (hard refresh alone may keep a stale iframe).
3. Sign in again on the Stage page if needed.

## Symptom of missing CSP `connect-src`

```text
Magic RPC Error: [-32603] Failed to fetch
```

Typical pattern:

- Page-side `fetch` to `/api/ens/sepolia-rpc` succeeds (`keyed=true`, `eth_chainId=0xaa36a7`).
- Magic `eth_sendTransaction` fails immediately after.
- Vercel runtime logs show **no** Magic→proxy `eth_estimateGas` / `eth_sendRawTransaction`
  (only the page probe).

Root cause confirmed in production: origin was in Allowed Origins but missing from
Magic CSP/`connect-src`. After adding CSP, Stage 5A `eth_sendTransaction` succeeded.

## DevTools verification

1. Open a **fresh** tab → production Stage route.
2. Network filter `sepolia-rpc`:
   - Page probe: `GET`/`POST` → 200 JSON-RPC.
3. Confirm Magics modal, then look for Magics iframe requests to
   `{origin}/api/ens/sepolia-rpc` (`eth_estimateGas`, `eth_sendRawTransaction`, …).
4. If Magics fails with `Failed to fetch` and those Magics requests never appear,
   re-check Magic CSP/`connect-src` (not the dRPC key).
5. On success, verify receipt + roles with an independent public client
   (not Magics).

## Pinned ENS nodes

```text
Passport:
victor.nomadic-passport.eth
0xc60a6d215c6da5d140152c60f32f60a6946efca7aebd26f39ff66018886a2834

Credential:
lisbon-house.victor.nomadic-passport.eth
0x6ad2126ebdb620e0dedc9df67cbb3256d7d948d91f24db92ab3ede1a419e7142

Never use broken historical node:
0x86ee08d08dc976a172e361396955cc752bd4328e943d606781a832ea0cc0b2fb
```

Use reviewed DNS-encoded names / calldata from Stage 3 where available.
Do not recompute namehash independently for Stage 5A revoke calldata.

## Stage 5A result (final)

```text
Tx: 0x9bb61d2b31b38a28573dfd4cf970a661c38befe0002482f4b4d9a8504f69e801

Issuer roles after revoke:
com.nomadic.status = 0
com.nomadic.issuedAt = 0
com.nomadic.expiresAt = 0
com.nomadic.metadata = 0

Credential metadata still:
issuer-demo-stage4-verified
```

Stage 5B was a **read-only issuer simulation** (expected revert) and is
**not** exposed as a frontend transaction.

See also: `docs/ENSV2_STAGE5A_FRONTEND.md`.

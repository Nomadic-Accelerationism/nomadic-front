# ENSv2 Stage 5A (frontend runner)

Hackathon Stage 5A page (hidden from normal navigation):

```text
/testing/ensv2-stage5a
```

Revokes Lisbon House issuer scoped `ROLE_SET_TEXT` permissions via one Magic
`eth_sendTransaction` multicall. Calldata and DNS name bytes come from
`lib/ensv2/stage5a-revoke-bundle.json` (copied from Stage 3 Group 5 grant tx —
do not recompute namehash).

**Status: COMPLETED** on Sepolia.

```text
Completion tx:
0x9bb61d2b31b38a28573dfd4cf970a661c38befe0002482f4b4d9a8504f69e801
```

When all four issuer roles are `0`, the page marks Stage 5A complete and does
**not** show another revoke button. Stage 5B is intentionally not implemented
in the frontend.

## RPC wiring (required)

```text
Server-only (never NEXT_PUBLIC_*):
ENS_SEPOLIA_RPC_URL=https://lb.drpc.live/sepolia/<key>

Browser + Magic iframe → same-origin proxy (no key in browser):
POST {origin}/api/ens/sepolia-rpc
  └─ server forwards to ENS_SEPOLIA_RPC_URL (dRPC)

Magic custom network:
{ rpcUrl: "{origin}/api/ens/sepolia-rpc", chainId: 11155111 }

Do NOT use Magic network: "sepolia" (changes the address set).
Do NOT put the dRPC URL/key in NEXT_PUBLIC_* or client bundles.

Public fallback (page reads only / proxy fallback if env unset):
https://ethereum-sepolia-rpc.publicnode.com
```

Also requires:

- `NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY`

## Magic Dashboard CSP (required)

`[-32603] Failed to fetch` on `eth_sendTransaction` was caused by Magic CSP,
not by a broken dRPC/proxy path.

**Allowed Origins is not enough.**

For the production origin / custom RPC origin, also add it to Magic Dashboard
**CSP / `connect-src` allowlist**, so the Magic iframe may call:

```text
https://nomadic-front-rosy.vercel.app
https://nomadic-front-rosy.vercel.app/api/ens/sepolia-rpc
```

Without `connect-src`, page-side `fetch` to the proxy can succeed while Magic
`eth_sendTransaction` fails with `Magic RPC Error: [-32603] Failed to fetch`
and no Magic→proxy request appears in Vercel logs.

## Namehash / Stage 3 resume protection

```text
Correct credential node:
0x6ad2126ebdb620e0dedc9df67cbb3256d7d948d91f24db92ab3ede1a419e7142

Never use broken historical node:
0x86ee08d08dc976a172e361396955cc752bd4328e943d606781a832ea0cc0b2fb
```

DNS bytes are reused from Stage 3 Group 5 grant tx
`0xb8fc4cbd…435d8` — do not re-encode independently.

Stage 5A refuses to re-send revoke when issuer roles are already all zero.

## Verify

```bash
npm run test:ensv2-stage3
```

See contracts doc: `nomadic-contracts/docs/ENSV2_STAGE5A.md`.

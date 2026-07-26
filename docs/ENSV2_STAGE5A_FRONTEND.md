# ENSv2 Stage 5A (frontend runner)

Hackathon Stage 5A page (hidden from normal navigation):

```text
/testing/ensv2-stage5a
```

Revokes Lisbon House issuer scoped `ROLE_SET_TEXT` permissions via one Magic
`eth_sendTransaction` multicall. Calldata and DNS name bytes come from
`lib/ensv2/stage5a-revoke-bundle.json` (copied from Stage 3 Group 5 grant tx —
do not recompute namehash).

Full Magic / CSP / proxy architecture: [`MAGIC_ENSV2_CUSTOM_NETWORK.md`](./MAGIC_ENSV2_CUSTOM_NETWORK.md).

**Status: COMPLETED** on Sepolia.

```text
Completion tx:
0x9bb61d2b31b38a28573dfd4cf970a661c38befe0002482f4b4d9a8504f69e801
```

## Completed-state behaviour

When live chain state shows:

- all four issuer roles are `0`, and
- `com.nomadic.metadata` remains `issuer-demo-stage4-verified`,

the page:

- displays **Stage 5A completed**;
- displays the successful transaction hash;
- does **not** expose another active revocation button;
- does **not** resend on reload (resume protection);
- does **not** automatically repair or mutate state;
- does **not** offer Stage 5B as a transaction;
- states clearly that **Stage 5B is intentionally read-only and not run from this page**.

## RPC wiring (required)

```text
Server-only (never NEXT_PUBLIC_*):
ENS_SEPOLIA_RPC_URL=https://lb.drpc.live/sepolia/<key>

Browser + Magic iframe → same-origin proxy (no key in browser):
POST|OPTIONS {origin}/api/ens/sepolia-rpc
  └─ server forwards to ENS_SEPOLIA_RPC_URL (dRPC)

Magic custom network:
{ rpcUrl: "{origin}/api/ens/sepolia-rpc", chainId: 11155111 }
```

Do **not**:

- use Magic `network: "sepolia"`;
- put dRPC URL/key in `NEXT_PUBLIC_*`;
- log upstream URL, key, or raw signed tx bytes from the proxy.

Public fallback (page reads / receipt verification only):

```text
https://ethereum-sepolia-rpc.publicnode.com
```

Also requires: `NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY`.

## Magic Dashboard (CSP root cause)

`[-32603] Failed to fetch` was **not** a broken dRPC key when the page probe
already returned `keyed=true`.

Confirmed root cause:

1. Production origin was in **Allowed Origins & Redirects**.
2. The custom RPC origin was **missing** from Magic Dashboard **CSP / `connect-src`**.

After adding CSP/`connect-src`, `eth_sendTransaction` succeeded.

**Allowed Origins is not sufficient for a Magic custom RPC.**

Setup checklist:

1. Add production app URL to Allowed Origins.
2. Add custom RPC origin to CSP/`connect-src`.
3. CSP changes may require a fresh Magic iframe/session.
4. Close old tabs and open a fresh session after CSP changes.

Symptoms of missing CSP: Magics `Failed to fetch` with **no** Magics→proxy
request in Vercel logs, while page `fetch` to the proxy works.

## Namehash / Stage 3 resume protection

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

DNS bytes are reused from Stage 3 Group 5 grant tx — do not re-encode
independently. Stage 5A refuses to re-send revoke when issuer roles are
already all zero.

## Verify

```bash
npm run test:ensv2-stage3
npm run test:ensv2-stage5a
```

See contracts doc: `nomadic-contracts/docs/ENSV2_STAGE5A.md`.

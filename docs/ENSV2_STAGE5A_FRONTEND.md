# ENSv2 Stage 5A (frontend runner)

Hackathon Stage 5A page:

```text
/testing/ensv2-stage5a
```

Revokes Lisbon House issuer scoped `ROLE_SET_TEXT` permissions via one Magic
`eth_sendTransaction` multicall. Calldata and DNS name bytes come from
`lib/ensv2/stage5a-revoke-bundle.json` (copied from Stage 3 Group 5 grant tx —
do not recompute namehash).

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

### Retest

1. Production: `https://nomadic-front-rosy.vercel.app/testing/ensv2-stage5a`
2. **Hard-refresh / new tab** (stale Magic iframe from publicnode rpcUrl will fail)
3. Confirm page shows Magic RPC = `/api/ens/sepolia-rpc` and `dRPC via proxy: yes`
4. Sign in **on that page only**, then confirm the Magic modal

See contracts doc: `nomadic-contracts/docs/ENSV2_STAGE5A.md`.

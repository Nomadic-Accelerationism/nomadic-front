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
ENS_SEPOLIA_RPC_URL=<keyed dRPC Sepolia URL>

Browser + Magic → same-origin proxy:
POST {origin}/api/ens/sepolia-rpc

Magic custom network:
{ rpcUrl: "{origin}/api/ens/sepolia-rpc", chainId: 11155111 }

Do NOT use Magic network: "sepolia" (changes the address set).

Public fallback (reads only / proxy fallback when env unset):
https://ethereum-sepolia-rpc.publicnode.com
```

Also requires:

- `NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY`

### Magic `[-32603] Failed to fetch`

1. Test on **production** `https://nomadic-front-rosy.vercel.app/testing/ensv2-stage5a`
   (Vercel-auth preview URLs return 401 to Magic’s iframe).
2. Set `ENS_SEPOLIA_RPC_URL` on Vercel **Production** (server-only).
3. Sign in **on the Stage 5A page** (do not create a second default Magic
   instance via `/login-user` in the same tab first).
4. The runner probes the proxy and prefills nonce/gas as hex before
   `eth_sendTransaction`.

See contracts doc: `nomadic-contracts/docs/ENSV2_STAGE5A.md`.

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

Magic iframe (auth.magic.link) → public Sepolia RPC (no key):
https://ethereum-sepolia-rpc.publicnode.com

Magic custom network:
{ rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com", chainId: 11155111 }

Page-side proxy (probes / receipt poll; keyed dRPC stays server-only):
POST {origin}/api/ens/sepolia-rpc

Do NOT use Magic network: "sepolia" (changes the address set).
Do NOT put ENS_SEPOLIA_RPC_URL in NEXT_PUBLIC_*.
```

Also requires:

- `NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY`

### Why Magic does not use the Vercel proxy

Prod logs showed page `fetch` to `/api/ens/sepolia-rpc` succeeding while
Magic `eth_sendTransaction` / `eth_chainId` failed with
`[-32603] Failed to fetch` **without any Magic→proxy request**. Magic's
iframe needs a CORS-friendly public RPC; publicnode is keyless and works
cross-origin from `auth.magic.link`.

### Magic `[-32603] Failed to fetch`

1. Test on **production** `https://nomadic-front-rosy.vercel.app/testing/ensv2-stage5a`
2. **Hard-refresh** (or open a fresh tab) so a stale Magic iframe from an
   older rpcUrl is not reused
3. Sign in **on the Stage 5A page** only (not `/login-user` first)
4. Confirm the Magic transaction modal

See contracts doc: `nomadic-contracts/docs/ENSV2_STAGE5A.md`.

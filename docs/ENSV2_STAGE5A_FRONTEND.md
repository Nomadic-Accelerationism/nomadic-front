# ENSv2 Stage 5A (frontend runner)

Hackathon Stage 5A page:

```text
/testing/ensv2-stage5a
```

Revokes Lisbon House issuer scoped `ROLE_SET_TEXT` permissions via one Magic
`eth_sendTransaction` multicall. Calldata and DNS name bytes come from
`lib/ensv2/stage5a-revoke-bundle.json` (copied from Stage 3 Group 5 grant tx —
do not recompute namehash).

Requires:

- `NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY`
- optional `NEXT_PUBLIC_SEPOLIA_RPC_URL` (defaults to `https://sepolia.drpc.org`)

See contracts doc: `nomadic-contracts/docs/ENSV2_STAGE5A.md`.

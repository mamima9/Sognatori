# Sognatori Web3 deployment runbook

This runbook is intentionally testnet-first. Do not run mainnet commands until the release checklist is approved.

## 1. Prepare the artwork metadata

- Review `metadata/sognatori.manifest.example.json` against the official roster and artwork files under `public/images`.
- Upload the 64 approved artwork files to an IPFS pinning provider selected by the project owner.
- Replace every `image` field with its final `ipfs://CID`.
- Replace descriptions only with approved lore. The current descriptions are neutral placeholders.
- Generate 6,400 metadata files with `node scripts/generate-nft-metadata.mjs`.
- Upload the generated directory to IPFS and pin it redundantly.
- Record the final directory URI; it must end in `/`.

## 2. Deploy to Base Sepolia

Install Foundry and contract dependencies:

```sh
cd contracts
forge install OpenZeppelin/openzeppelin-contracts --no-commit
forge install foundry-rs/forge-std --no-commit
forge test -vvv
```

Set deployment values in a local, untracked environment file or shell session:

```sh
export DEPLOYER_PRIVATE_KEY=...
export SOGNATORI_ADMIN=0x... # preferably a multisig; testnet may use a controlled admin
export SOGNATORI_MINTER=0x... # dedicated backend minter address
export SOGNATORI_METADATA_BASE_URI=ipfs://YOUR_METADATA_DIRECTORY_CID/
export BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

Deploy only after tests pass:

```sh
forge script script/DeploySognatori.s.sol:DeploySognatori \
  --rpc-url "$BASE_SEPOLIA_RPC_URL" \
  --broadcast
```

Record the deployed contract address. Verify the source on the Base Sepolia explorer. Never commit the private key or local environment file.

## 3. Apply Supabase schema and deploy functions

The current Supabase project reference in the repository's client URL is `yvtzzhcjwoppcskprmee`. Confirm that this is still the intended project before linking.

```sh
supabase link --project-ref yvtzzhcjwoppcskprmee
supabase db push
supabase functions deploy wallet-link
supabase functions deploy mint-worker --no-verify-jwt
```

Set Edge Function secrets in the Supabase dashboard/CLI. Use the values from `supabase/functions/README.md`. For the testnet phase configure only the Sepolia contract and RPC URL.

## 4. Configure the frontend

Set the frontend environment variable in the hosting environment:

```
VITE_BASE_CHAIN_ID=84532
```

The profile wallet panel uses an injected EIP-1193 wallet and asks the user to sign a message. The signature is not a transaction and does not pay gas.

## 5. Start the mint worker

Configure a trusted scheduler to POST to the deployed `mint-worker` Edge Function with:

- Header: `x-mint-worker-secret: <MINT_WORKER_SECRET>`
- JSON body: `{"limit":10}`

Run on a short interval, such as once per minute. The secret must remain in the scheduler, never in frontend code.

## 6. End-to-end acceptance test

1. Create a dedicated test account and connect a Base Sepolia wallet.
2. Verify the wallet signature in the profile.
3. Acquire a test card through the normal in-game pack flow.
4. Confirm one `nft_mint_jobs` row exists with the deterministic token ID.
5. Invoke the worker and confirm the job becomes `MINTED`.
6. Verify `ownerOf(tokenId)` and the token URI on Base Sepolia.
7. Retry the worker and confirm no duplicate token is created.
8. Test a failed transaction, stale worker recovery, wallet reconnect and wallet-change protection.
9. Confirm Arcade and Multiplayer still use their historical first-29 roster.

## 7. Production gate

Production requires a separate Base mainnet deployment and contract address, mainnet RPC, mainnet wallet configuration, multisig admin, dedicated minter key, metadata pinning redundancy, legal/IP confirmation, transfer synchronization for marketplace/trades, monitoring, recovery procedures and an independent smart-contract security review.

The testnet collection and mainnet collection are distinct contracts. Do not switch a user's verified wallet/chain after NFTs have been minted; the current schema intentionally blocks that until an explicit migration/transfer flow is built.

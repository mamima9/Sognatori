# Sognatori Base NFT backend setup

## Edge Functions

Deploy both functions after applying the SQL migrations:

```sh
supabase functions deploy wallet-link
supabase functions deploy mint-worker --no-verify-jwt
```

The wallet-link endpoint validates the caller's Supabase access token itself. The mint worker uses a separate high-entropy secret header and therefore disables gateway JWT verification.

## Secrets

Set these with the Supabase CLI or dashboard. Never expose them as Vite variables.

Required for `wallet-link`:
- `SUPABASE_URL` (provided automatically by Supabase)
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_ORIGIN` (exact production origin; configure CORS to this origin)

Required for `mint-worker`:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MINT_WORKER_SECRET` (long random secret sent as `x-mint-worker-secret`)
- `NFT_MINTER_PRIVATE_KEY` (dedicated minter key; never the admin/multisig key)
- `NFT_CONTRACT_ADDRESS_BASE_SEPOLIA`
- `NFT_CONTRACT_ADDRESS_BASE_MAINNET` (only after production deployment)
- `BASE_SEPOLIA_RPC_URL`
- `BASE_MAINNET_RPC_URL` (only when enabling mainnet)

The worker reads the chain ID saved with the player's verified wallet and uses the matching RPC and contract address. Do not configure a mainnet contract until the contract has been audited and deployed.

## Run the worker

The worker is an authenticated batch endpoint. Invoke it from a trusted scheduler (for example, a private CI schedule or a server cron) using POST, JSON body `{"limit":10}`, and header `x-mint-worker-secret`. Run every minute or at a suitable low-frequency interval. Never expose this secret in the browser.

## Local wallet flow

The profile panel uses the EIP-1193 injected provider exposed by compatible browser wallets. It switches to Base Sepolia by default. Configure `VITE_BASE_CHAIN_ID=8453` only when production contracts and backend settings are ready; otherwise leave it unset (defaults to 84532).

The wallet-link Edge Function signs no transactions. It issues a short-lived challenge and verifies the player's personal signature before linking the address. The signature does not authorize token transfers.

## Important operational limitations

- Do not deploy the mint worker until the contract is deployed and the correct contract address is configured.
- Existing owned card instances are not auto-minted. Define and approve a legacy-card eligibility/migration policy before any backfill.
- Marketplace and trade transfers are not yet synchronized to ERC-721 transfers. Keep on-chain trading disabled until that integration exists.
- Metadata generation requires a reviewed 64-item manifest and approved IPFS artwork CIDs.
- Base Sepolia test mints have no real monetary value. Mainnet release requires legal rights confirmation, audit, multisig administration and a recovery plan.

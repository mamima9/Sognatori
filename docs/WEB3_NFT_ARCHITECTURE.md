# Sognatori Web3 — Technical Architecture

Status: design proposal (no contracts deployed, no keys or wallet provider configured).
Branch: `web3/nft-architecture`

## Product decisions

- Network: Base mainnet for production; Base Sepolia for development and QA.
- NFT standard: ERC-721, one independently transferable token per physical/digital card copy.
- Supply ceiling: 6,400 tokens total = 64 Sognatori definitions × 100 serial copies.
- Mint policy: progressive. A token is minted only when a player earns/claims the corresponding card.
- Wallet UX: embedded/smart wallet created through a passkey-friendly onboarding flow; retain an adapter so a supported external wallet can be added later.
- No rarity tiers are introduced. All 100 copies of each Sognatore are equivalent unless game design defines otherwise later.
- The 64 artwork discoveries/unlocks are not NFTs and must remain separate from card ownership.
- Arcade and Multiplayer roster restrictions (first 29 Sognatori) are unaffected. NFT catalog remains all 64.

## Repository observations

The current app uses React/Vite, Supabase Auth and Supabase Postgres. Existing collection logic is in `src/lib/arabniteCards.js`. The current schema already models 64 definitions and 100 numbered instances per definition in `sognatore_card_definitions` and `sognatore_card_instances`. The 2026-11-20 migrations remove provisional rarity and keep artwork discovery separate from actual card instances.

The current `sognatore_open_pack` RPC assigns an off-chain `owner_id` immediately. That is not sufficient as the final source of truth for an NFT collection. The Web3 rollout must add a mint lifecycle and make the UI distinguish a card acquired in-game from a token confirmed on Base.

## Token identity

Use deterministic token IDs:

```
tokenId = (definitionIndex - 1) * 100 + serialNumber
definitionIndex: 1..64
serialNumber:    1..100
tokenId:         1..6400
```

Examples:
- Sognatore #1, copy 1 → tokenId 1
- Sognatore #1, copy 100 → tokenId 100
- Sognatore #64, copy 1 → tokenId 6301
- Sognatore #64, copy 100 → tokenId 6400

Keep the human-facing serial as `001/100`; tokenId is a technical identifier, not a rarity ranking.

## Smart contract

Proposed contract: `SognatoriCards`, Solidity, OpenZeppelin ERC-721 + AccessControl (or Ownable2Step with a dedicated minter role).

Required invariants:
1. Maximum global supply is 6,400.
2. Each definition index has at most 100 minted copies.
3. A serial number can be minted only once for its definition.
4. Only the authorized backend minter can mint.
5. Minting is non-reentrant and emits standard ERC-721 events plus a project event containing definition index and serial.
6. Contract owner/admin is a multisig or controlled operational wallet, not a frontend key.
7. Emergency pause can stop minting; it must not confiscate or block ordinary transfers.
8. No arbitrary burn function in the first release.
9. Metadata URI points to immutable IPFS content. Artwork and metadata must be pinned redundantly before mainnet minting.

Suggested external interface:
- `mintCard(address to, uint8 definitionIndex, uint8 serialNumber)` — authorized minter only; computes deterministic tokenId and rejects duplicates.
- `mintedForDefinition(uint8 definitionIndex)` — public count.
- `tokenURI(uint256 tokenId)` — immutable metadata URI.
- `totalSupply()` — minted count.

Do not deploy until contract tests, independent review, and metadata validation pass.

## Wallet and identity

- Keep Supabase Auth as the game's login identity.
- Add a `player_wallets` record linking one Supabase user to their Base smart-account address, provider, chain ID, verification timestamp and status.
- Wallet creation/linking happens through the chosen wallet SDK using passkey/social login; the app never handles raw private keys or seed phrases.
- Verify the wallet ownership/link operation with a signed challenge or provider-issued proof. Never accept a client-submitted address as verified without proof.
- The wallet address is the on-chain recipient. Supabase user ID remains the internal game identity.
- Keep wallet-provider integration behind a small adapter so the app is not coupled to one vendor.
- Sponsor gas only after selecting and configuring a paymaster; enforce per-user and global spending limits.

## Progressive mint lifecycle

The game must not report an NFT as minted until Base confirms the transaction.

1. Player opens a pack. Existing secure RPC selects and reserves three available card instances.
2. In the same database transaction, create one mint job per card with a unique idempotency key and state `PENDING_WALLET` or `QUEUED`.
3. If the player has no verified wallet, the cards remain acquired in-game and the jobs wait. When a wallet is linked, jobs are queued.
4. A server-side worker reads jobs and calls the contract with the backend minter key held only in a secrets manager/KMS.
5. Before sending, worker checks the deterministic tokenId on-chain. If already minted to the intended wallet, mark job confirmed; if minted elsewhere, stop and flag for manual reconciliation.
6. Submit transaction and store transaction hash. Wait for the configured Base confirmation/finality policy.
7. Verify `ownerOf(tokenId)` equals the recipient and verify emitted event; only then mark job `MINTED`.
8. Retry transient RPC failures with bounded exponential backoff. Unique idempotency key + deterministic tokenId prevent duplicate issuance.

Never put the private minter key, Supabase service-role key, paymaster secret, or wallet provider secret in Vite `VITE_*` variables or browser code.

## Database additions (proposed)

### `player_wallets`
- `user_id` UUID PK/FK to auth.users
- `address` text unique, normalized lowercase
- `chain_id` integer (Base mainnet 8453; Sepolia 84532)
- `provider` text
- `status` text: PENDING / VERIFIED / DISCONNECTED
- `verified_at`, `created_at`, `updated_at`

### `nft_mint_jobs`
- `id` UUID PK
- `card_instance_id` UUID unique FK to sognatore_card_instances
- `user_id` UUID FK to auth.users
- `token_id` bigint unique, computed from definition index + serial
- `recipient_address` text
- `status` text: PENDING_WALLET / QUEUED / SUBMITTED / MINTED / FAILED / NEEDS_REVIEW
- `tx_hash` text unique nullable
- `attempt_count` integer
- `last_error` text nullable
- `idempotency_key` text unique
- `created_at`, `updated_at`, `minted_at`

### Ownership and synchronization
- Keep `sognatore_card_instances` as the game inventory/reservation record, not the final proof of on-chain ownership.
- Add `token_id`, `mint_status` or derive mint status from `nft_mint_jobs`; avoid duplicating contradictory status fields.
- After mint, listen to ERC-721 Transfer events (indexer or worker) to sync external transfers back into the display cache.
- For ownership-sensitive actions, verify on-chain ownership or use a recently indexed state with an explicit freshness policy.
- A transfer outside the game must update the game inventory: the old owner loses the tradable card and the new wallet owner gains it after identity linking. Never let stale Supabase `owner_id` override chain ownership.

## Pack opening and randomness

- Keep pack opening atomic: charge currency, reserve card copies, create mint jobs, and record pack history in one DB transaction.
- The existing RPC already serializes the shared card pool; extend it rather than introducing a second pack-opening path.
- All copies remain equally eligible; do not reintroduce rarity tiers.
- For initial testnet, a server-side cryptographically secure RNG may select among unreserved instances. Before public valuable distribution, decide whether to add verifiable randomness (e.g. a supported VRF integration on Base) or publish a transparent, auditable draw mechanism. Do not claim the draw is trustless if the backend controls selection.

## Metadata and artwork

Each token metadata document should include stable fields:
- `name`: Sognatore name + serial (e.g. "Cillymbu #023")
- `description`: approved lore/description
- `image`: IPFS URI to approved artwork
- `external_url`: official Sognatori collection/game URL
- `attributes`: Sognatore ID, serial number, total copies (100), collection name

The 64 artwork files and 6,400 JSON metadata files must be reviewed, pinned and tested. Reuse one artwork asset per Sognatore; metadata varies by serial. Do not include private user data or mutable game stats in NFT metadata.

## Rollout plan

### Phase 0 — prerequisites
- Confirm legal rights to all 64 artworks, names and lore, plus rights to mint and transfer the assets.
- Choose wallet provider and paymaster; configure Base Sepolia and production Base.
- Audit existing Supabase policies/RPCs and current inventory counts before schema changes.
- Confirm whether pre-existing card instances are eligible for claim/migration and define eligibility rules.

### Phase 1 — contract
- Implement ERC-721 contract with 6,400 cap and per-definition 100 cap.
- Add unit tests for every cap, duplicate serial, unauthorized minter, pause, URI and transfer behavior.
- Deploy to Base Sepolia only.

### Phase 2 — backend
- Add wallet verification and mint-job schema/RPCs.
- Add server-side mint worker, transaction monitoring, retry and reconciliation.
- Make pack opening create mint jobs atomically without exposing privileged credentials.

### Phase 3 — frontend
- Add wallet setup flow to profile.
- Show card status: Acquired / Mint pending / On-chain.
- Show serial, Base explorer link and wallet address where appropriate.
- Preserve current collection and gameplay flows when wallet is not yet linked.

### Phase 4 — testnet and migration
- Test pack opening, wallet linking, mint, retry, transfers, disconnect/reconnect, account recovery and race conditions.
- Test migration/claim for eligible existing cards without minting duplicate token IDs.
- Verify 64 artwork definitions and all 6,400 metadata URIs.

### Phase 5 — production
- Independent smart-contract/security review.
- Multisig admin and protected minter key.
- Mainnet deployment, verified source code, monitoring, incident runbook and backup/reconciliation procedure.

## Acceptance criteria

- No more than 6,400 tokens can ever be minted.
- No definition has more than 100 minted serials.
- A tokenId can never be minted twice.
- Only verified game rewards can create mint jobs.
- A retry cannot mint a second token.
- Frontend cannot call privileged mint directly.
- A card is labeled "On-chain" only after successful receipt and owner verification.
- External transfers are reflected in the game inventory.
- No private keys or privileged secrets are shipped to the browser.
- Arcade/Multiplayer continue to use their existing first-29 roster, independent of NFT catalog.

## Official technical references

- Base: https://docs.base.org/
- Base Account: https://docs.base.org/identity/smart-wallet
- OpenZeppelin Contracts: https://docs.openzeppelin.com/contracts/
- ERC-721: https://eips.ethereum.org/EIPS/eip-721
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Supabase Database Webhooks: https://supabase.com/docs/guides/database/webhooks

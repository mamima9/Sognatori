-- Explicit table privileges for the authenticated profile reads and service-side worker.
grant select on public.player_wallets to authenticated;
grant select on public.nft_mint_jobs to authenticated;
grant all on public.player_wallets to service_role;
grant all on public.nft_wallet_challenges to service_role;
grant all on public.nft_mint_jobs to service_role;

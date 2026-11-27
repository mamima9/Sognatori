# City XIV — Online cooperative rooms

This feature adds a secure Supabase-backed online room flow for 2–5 players to the City XIV page.

## Setup required

**The migration is not applied to the live Supabase project by this repository PR.** Apply `supabase/migrations/202611270001_cityxiv_online_coop.sql` in the Supabase SQL Editor or through the project's approved migration workflow before testing online rooms.

No service-role key is used in the frontend. The migration exposes authenticated RPC functions for room creation/joining, readiness, starting, position updates, heartbeat/host handoff, action processing, advancement, resume and leave. Table writes are revoked from client roles; room/player reads are restricted to room members. Realtime publication is enabled for the room and player tables.

## Flow

- Create a 2–5-player room and share the six-character code.
- Players choose one of the first 29 Sognatori, join and mark ready.
- The host starts when at least two players are present and all are ready.
- Players move in the existing Lumequieto 3D scene. Their chosen artwork is used for their avatar and remote-player billboards; positions and lobby state are synchronized through Supabase Realtime.
- Each player has three actions per round. Explore, talk, attack, area attack (RPC supported), protect, recover, recruit and switch are processed by an RPC with membership/action validation. Encounter HP, XP, coins, clues, stage progression and ending state are shared.
- Reconnect uses the authenticated user's room lookup. Heartbeats refresh presence and may transfer host when the host has been stale for two minutes; leaving also transfers the host.
- The room's shared state persists in the database.

## Current verification

The front-end build/preview should be checked before merging. Live database integration cannot be verified until the migration is applied. The browser sandbox in the current development environment cannot run interactive gameplay, so multi-device gameplay and disconnect/reconnect testing remain unverified.

## Notes

- Multiplayer uses simplified shared cooperative combat and progression; it is a separate online mode from the existing local 1–5-player simulator.
- Avatar images are camera-facing textured planes (2.5D) in the current Lumequieto renderer, not rigged character models.

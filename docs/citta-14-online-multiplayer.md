# City XIV — Online cooperative rooms

This feature adds a Supabase-backed online room flow for 2–5 players to City XIV.

## Setup required

**The City XIV co-op source is now in `main` and a Vercel Production deployment is READY, but the Supabase migration stack is still unapplied/unverified. A READY frontend deployment does not make the multiplayer database-backed flow operational.**

### Required SQL deployment order (do not skip incrementals)
1. `supabase/migrations/202611270001_cityxiv_online_coop.sql` — base tables, RLS, RPCs, realtime publication.
2. `supabase/migrations/202611280001_cityxiv_advance_host_handoff.sql` — stale-host takeover and active-roster-safe zone advancement.
3. `supabase/migrations/202611280002_cityxiv_ping_phase_reconcile.sql` — heartbeat phase reconciliation when members become stale.
4. `supabase/migrations/202611280003_cityxiv_waiting_room_cleanup.sql` — remove stale waiting-lobby reservations only.
5. `supabase/migrations/202611280004_cityxiv_leave_host_handoff.sql` — host handoff on leave/staleness.
6. `supabase/migrations/202611280005_cityxiv_position_rate_limit.sql` — server-enforced position rate limit and finite-coordinate checks.
7. `supabase/migrations/202611280006_cityxiv_recruit_consensus.sql` — contextual recruitment offers and unanimous voting by the fresh active roster.

Use the Supabase project's authorized migration workflow, in this order, after recording the current schema and migration history. Review each result before proceeding. Do not apply the incrementals ahead of the base migration. If any migration fails, stop, inspect transaction/schema state, and use a reviewed rollback/recovery migration; do not delete migration-history entries.

No service-role key is used in the frontend. The migration stack exposes authenticated RPC functions for room creation/joining, readiness, starting, position updates, heartbeat/host handoff, action processing, advancement, resume, leave and unanimous recruitment. The recruitment migration locks the room, checks candidate uniqueness server-side, tracks votes in shared room state and assigns the candidate only after unanimity. Table writes are revoked from client roles; room/player reads are restricted to room members. Realtime publication is enabled for the room and player tables.

## Flow

- Create a 2–5-player room and share the six-character code.
- Players choose one of the first 29 Sognatori, join and mark ready.
- The host starts when at least two players are present and all are ready.
- Players move in the Lumequieto 3D scene. Their chosen artwork is used for their avatar and remote-player billboards; positions and lobby state are synchronized through Supabase Realtime.
- Each player has exactly three gameplay actions per round. Explore, talk, attack, area attack, protect, recover and switch are processed by an RPC with membership/action validation. Recruitment is a contextual, once-per-zone proposal side decision: the proposer and every fresh active member must explicitly vote yes; any no vetoes it. A successful recruit becomes the proposer’s bench Sognatore and does not consume one of the three gameplay actions. Encounter HP, XP, coins, clues, stage progression and ending state are shared.
- Reconnect uses the authenticated user's room lookup and restores the last persisted position on initial room hydration. Heartbeats refresh presence; a member is considered active after a heartbeat within the last 90 seconds. Host handoff is triggered by heartbeat, and the enemy-turn/boss-start RPC can take over if the host is stale beyond that window. Leaving also transfers the host. Heartbeat now locks the room before the player row, matching the room RPC lock order to reduce deadlock risk. Ready-state changes are restricted to the waiting lobby, and server actions reject ended expeditions.
- The room's shared state persists in the database.

## Release-gate manual test matrix

Run this only after the migration is applied, using separate authenticated accounts/devices (not multiple tabs with one account). Do not promote the feature to production until the checks below pass.

| Test | Expected result |
| --- | --- |
| Host creates a 2-player room | A six-character code appears; host is listed and ready |
| Player 2 joins with the code | Both players and their selected characters appear; player 2 starts unready |
| Join with a wrong/expired code | Rejected without creating a player record |
| Join when the room is full | Rejected; existing members remain unchanged |
| Host starts with fewer than 2 players or someone unready | RPC rejects start |
| Host starts with 2 ready players | Lobby changes to playing for both clients |
| Movement from each client | Remote player position updates; each client sees the other avatar |
| Reconnect after refresh | Same room/state and persisted X/Z position restore |
| Actions over a round | Three actions per player; actions serialize and the enemy turn/reset happens once |
| Enemy defeat | Shared coins and XP are awarded once, even with concurrent actions |
| Contextual recruit offer | Only an eligible member with an empty bench may propose an unused candidate; one proposal per proposer per zone |
| Recruit vote with 2–5 active players | Each fresh active member must explicitly vote yes; a single no cancels; offline members are excluded after the 90-second freshness window |
| Solo continuation recruit vote | The sole fresh member must explicitly vote yes; no implicit proposer vote is counted |
| Candidate already active/benched | Server rejects the proposal/acceptance and no duplicate is added |
| Stage advance | Host-only; objective requirements enforced by RPC |
| Direct table write attempt | Authenticated client INSERT/UPDATE/DELETE is denied |
| Non-member room read/action | Denied or returns no room data |
| Host disconnects during a players phase | After 90 seconds of stale presence, an active member can resolve the enemy phase and take over host; offline HP is preserved |
| Member disconnects with fewer than 3 actions | Active roster excludes the stale member, phase advances without stalling, offline HP is preserved, actions reset |
| Reconnect within or after a phase | Player row, position and character state remain; player becomes active again after heartbeat, phase eligibility depends on current phase |
| Host disconnects during boss preparation | A fresh member can take over host and start only if the active roster (2–5) is ready |
| 5-player room | Lobby, position synchronization, shared round and action processing work at 5 players |
| Boss victory | Shared state marks expedition finished; subsequent actions/advance are rejected |

Record the Supabase migration versions, the test account count, pass/fail results, and any RPC error. These tests are still release gates; the Production frontend deployment alone does not satisfy them.

## Current verification

The migration received a source audit that corrected malformed dollar-quote delimiters in the readiness and heartbeat RPCs, removed a redundant leave-RPC definition, and added a guard so a downed player cannot act unless switching or recovering with a living bench character. The migration is statically checked for balanced dollar-quoted blocks and duplicate RPC definitions; it has **not** been executed against PostgreSQL/Supabase in this environment. The active roster uses a 90-second heartbeat window; stale members are skipped for turn completion and enemy damage, round actions are reset, and offline HP/state is preserved. A non-host can take over the enemy phase or boss start when the previous host has stale presence. The Production deployment for merge commit 7752fa947a081d781ed3647e4ef41671716767b4 is READY on Vercel; this confirms frontend deployment only. The live database integration cannot be verified until the migration is applied. Interactive gameplay and multi-device testing are unavailable in the current browser sandbox, so this test matrix is a release gate, not a claim that these tests have passed.

## Notes

- Multiplayer uses simplified shared cooperative combat and progression; it is separate from the existing local 1–5-player simulator.
- Avatar images are camera-facing textured planes (2.5D) in the current Lumequieto renderer, not rigged character models.


## Three-action mobile-first loop (incremental implementation)

- During zone preparation, the three selectable actions are Explore, a single-player minor fight, and Talk. Each consumes one of the player's three actions; arbitrary combinations are valid.
- Explore contributes shared zone progress and clues; Talk contributes a clue and 5 shared coins; minor fights resolve as a single action, apply an enemy retaliation if the character cannot defeat the minor monster, and grant personal XP plus shared coins on victory.
- The action panel displays each player's action count/readiness. When all members with a fresh heartbeat (90-second window) have used three actions, the room state switches to an explicit enemy phase. Stale members are skipped for the current phase, their action counter is reset, and their HP is preserved while offline; reconnecting restores their stored state and they can participate in the next phase. The host client automatically calls the idempotent cityxiv_enemy_turn RPC; it resolves the computer enemy, resets action counters and advances the round. Manual phase-advance controls are removed from the action UI.
- Party Team opens a mobile-friendly panel showing all party members, active Sognatori, HP, level, XP, action count and recruited bench character. The panel hides movement joystick and Interagisci.
- Recruitment is not a default action; the RPC rejects unilateral recruitment until a party-offer/decision flow is implemented.
- The renderer caps mobile pixel ratio and reduces shadow-map resolution for performance, while using higher shadow resolution on larger screens.

## Additional release checks for this increment

| Check | Expected result |
| --- | --- |
| Three actions selected by each member | Only then does the state switch to enemy phase |
| Host sees enemy phase | Host automatically calls enemy-turn RPC; duplicate calls are idempotent |
| Enemy turn resolves | HP/guard update, actions reset and round increments |
| Explore, Talk and minor fight | All consume one action and grant their respective progress/reward |
| Party Team panel | Shows party data and hides overworld controls while open |
| Non-host client | Cannot execute enemy turn or bypass phase lock |

The stale-member and host-handoff fixes are source-level only and not yet runtime-verified against a live Supabase database. The migration remains a release prerequisite; do not merge/deploy the online loop until the migration and multi-device test matrix above pass.

- Shared exploration treasure: the server records a once-per-zone treasure flag and grants the party 20 coins when the exploration threshold is reached; the treasure counter and flag are synchronized in the room state.


## Mandatory graphics release gate

The required visual target is a curated, real 3D RPG standard—not placeholder cubes or generic avatars: recognizable original Sognatore models, detailed and distinct zones, vegetation/structures, atmosphere, materials, lighting, shadows and effects, coherent presentation across overworld, battles and UI, with mobile performance maintained. The selected Sognatore must be its actual 3D model for both local and remote party members.

This increment only improves renderer performance settings and shadow quality. The current multiplayer avatars remain camera-facing 2.5D artwork planes; a repository code search did not surface a GLTF/GLB model-loader or rigged model pipeline. The graphics gate is therefore **not met** and must not be represented as complete until rigged original assets and visual review are available.


## Anti-farming guard for the three-action loop

- Exploration treasure progress now counts separately within each stage. Two exploration actions in that specific zone unlock its shared treasure; previous-zone exploration does not carry into the next zone's threshold.
- Talk and minor-fight reward claims are limited to once per player per zone, stored server-side in room flags. Repeat attempts are rejected, and the mobile action buttons reflect the player's already-claimed status.
- The HUD now shows exploration progress for the current zone rather than dumping internal flag keys.
- This is a source-level change only. Vercel rate-limit failure means the latest branch commit has no verified fresh preview build; Supabase and multi-device tests remain pending.

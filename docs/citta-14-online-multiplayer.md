# City XIV — Online cooperative rooms

This feature adds a Supabase-backed online room flow for 2–5 players to City XIV.

## Setup required

**The migration is not applied to the live Supabase project.** Apply `supabase/migrations/202611270001_cityxiv_online_coop.sql` in the Supabase SQL Editor or through the project's approved migration workflow before testing online rooms.

No service-role key is used in the frontend. The migration exposes authenticated RPC functions for room creation/joining, readiness, starting, position updates, heartbeat/host handoff, action processing, advancement, resume and leave. Table writes are revoked from client roles; room/player reads are restricted to room members. Realtime publication is enabled for the room and player tables.

## Flow

- Create a 2–5-player room and share the six-character code.
- Players choose one of the first 29 Sognatori, join and mark ready.
- The host starts when at least two players are present and all are ready.
- Players move in the Lumequieto 3D scene. Their chosen artwork is used for their avatar and remote-player billboards; positions and lobby state are synchronized through Supabase Realtime.
- Each player has three actions per round. Explore, talk, attack, area attack, protect, recover, recruit and switch are processed by an RPC with membership/action validation. Encounter HP, XP, coins, clues, stage progression and ending state are shared.
- Reconnect uses the authenticated user's room lookup and restores the last persisted position on initial room hydration. Heartbeats refresh presence and may transfer host when the host has been stale for two minutes; leaving also transfers the host. Heartbeat now locks the room before the player row, matching the room RPC lock order to reduce deadlock risk. Ready-state changes are restricted to the waiting lobby, and server actions reject ended expeditions.
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
| Stage advance | Host-only; objective requirements enforced by RPC |
| Direct table write attempt | Authenticated client INSERT/UPDATE/DELETE is denied |
| Non-member room read/action | Denied or returns no room data |
| Host disconnects | Active member becomes host after the documented heartbeat window; host can resume/start when valid |
| 5-player room | Lobby, position synchronization, shared round and action processing work at 5 players |
| Boss victory | Shared state marks expedition finished; subsequent actions/advance are rejected |

Record the Supabase migration version, the test account count, pass/fail results, and any RPC error before merging.

## Current verification

The migration received a source audit that corrected malformed dollar-quote delimiters in the readiness and heartbeat RPCs, removed a redundant leave-RPC definition, and added a guard so a downed player cannot act unless switching or recovering with a living bench character. The migration is statically checked for balanced dollar-quoted blocks and duplicate RPC definitions; it has **not** been executed against PostgreSQL/Supabase in this environment. The latest PR preview build is pending/subject to Vercel status checks. The live database integration cannot be verified until the migration is applied. Interactive gameplay and multi-device testing are unavailable in the current browser sandbox, so this test matrix is a release gate, not a claim that these tests have passed.

## Notes

- Multiplayer uses simplified shared cooperative combat and progression; it is separate from the existing local 1–5-player simulator.
- Avatar images are camera-facing textured planes (2.5D) in the current Lumequieto renderer, not rigged character models.


## Three-action mobile-first loop (incremental implementation)

- During zone preparation, the three selectable actions are Explore, a single-player minor fight, and Talk. Each consumes one of the player's three actions; arbitrary combinations are valid.
- Explore contributes shared zone progress and clues; Talk contributes a clue and 5 shared coins; minor fights resolve as a single action, apply an enemy retaliation if the character cannot defeat the minor monster, and grant personal XP plus shared coins on victory.
- The action panel displays each player's action count/readiness. When all room members have used three actions, the room state switches to an explicit enemy phase. The host client automatically calls the idempotent cityxiv_enemy_turn RPC; it resolves the computer enemy, resets action counters and advances the round. Manual phase-advance controls are removed from the action UI.
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

This increment is source-reviewed but not yet runtime-verified against a live Supabase database. The migration remains a release prerequisite; do not merge/deploy the online loop until the migration and multi-device test matrix above pass.

- Shared exploration treasure: the server records a once-per-zone treasure flag and grants the party 20 coins when the exploration threshold is reached; the treasure counter and flag are synchronized in the room state.

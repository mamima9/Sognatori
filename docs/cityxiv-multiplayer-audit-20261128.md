# City XIV multiplayer source audit — 28 November 2026

## Incremental fix

Commit `4f1f309ad06956a5edaab91ab91ec16d7d4cb0be` adds `supabase/migrations/202611280001_cityxiv_advance_host_handoff.sql`.

The new replacement for `cityxiv_advance(uuid)`:
- Locks the room before member-row operations.
- Authenticates and refreshes the invoking room member.
- Allows a fresh member to assume zone-advance host authority only when the previous host heartbeat is absent or older than 90 seconds.
- Checks action completion only for members with a fresh heartbeat.
- Resets action/guard counters for all persisted members at a zone boundary, preventing stale actions from carrying into the newly unlocked zone.
- Preserves stage objective checks, shared victory rewards, and the stage-3 preparation gate.
- Reapplies RPC-only execution permissions.

## Static audit findings

- The original co-op migration has a consistent room-first lock order in the examined room/action/heartbeat/advance RPCs. This is a source observation, not proof of absence of database deadlocks.
- Rewards and state changes in the examined action RPC are serialized by the room row lock; per-zone reward flags make repeated Talk/minor-fight/treasure claims reject or remain single-award.
- The 90-second active-roster checks are source-level only; database clock, realtime propagation, race behavior, and concurrent calls remain untested.
- Host stale takeover was previously covered by enemy-turn and boss-start RPCs, but not by zone advancement. This incremental migration addresses that gap.
- Recruitment is intentionally still disabled; the unanimous-consensus flow is not implemented.

## Migration/recovery

Apply the original migration `202611270001_cityxiv_online_coop.sql` first, then `202611280001_cityxiv_advance_host_handoff.sql`, using an authorized Supabase migration workflow. Before execution, capture the current schema/function definitions and migration state. If the new migration fails, do not promote; inspect the failed transaction and schema state, then restore the prior `cityxiv_advance(uuid)` definition from the first migration only if the transaction/schema state permits. For a successful application that needs rollback, recreate the prior function definition from the original migration in an approved rollback migration, rather than deleting applied migration history. This is a documented recovery approach, not an executed rollback test.

## Test matrix additions

- Zone advance when the original host is fresh: non-host rejected.
- Zone advance when host is stale (>90s): fresh member takes over and advance is accepted only if stage prerequisites and active actions are satisfied.
- Missing host player row: eligible member can take over.
- Stale member with nonzero action counter: does not block zone advance; counter resets at the boundary.
- Concurrent advance attempts: room lock serializes calls; second call must fail or observe the updated stage rather than duplicate progression.
- Reconnect across stage boundary: player state and position remain, but action/guard counters reset.

## Verification state

The incremental SQL is source-reviewed only. It has not been executed or syntax-tested by PostgreSQL, migration applied, rollback tested, or multi-client runtime-tested. The frontend build is READY for code commit `c238ac0aea160457f934d569ac92c8dd7822125f` at https://sognatori-opwu9jeih-manu-de-miccio.vercel.app. The latest branch head at the time of this note is a documentation-only commit, with its deployment queued; the READY build covers the code changes.

## Additional source fixes (automation audit)

- The base online-co-op migration now permits the authenticated member to use the `recover` action when their active Sognatore is KO and their bench is absent or also KO. This revives the active Sognatore by the existing recovery rule (5 HP), consumes one action, and prevents the KO condition from permanently blocking the mandatory three-action phase.
- Boss preparation/activation now requires at least one fresh active member (still capped at five), rather than two. The room itself is still initially launched by the existing 2–5 player lobby rule; this change permits a remaining member to continue if the others become stale/disconnected after launch.

### Additional test cases

- Active Sognatore KO with no bench: `recover` succeeds, restores HP, and consumes exactly one action.
- Active and bench both KO: `recover` succeeds for the active slot; switching remains blocked if the bench is KO.
- Boss prep with one fresh member after a room started with two or more: that member can confirm and server-authoritative boss start succeeds; stale members are ignored for readiness.
- Boss prep with zero active members: boss start must reject.
- Boss prep with two to five active members: every fresh member must be ready before boss activation.

These remain source-level changes and test cases; no PostgreSQL execution or multi-client runtime validation has been performed.


## UI/backend consistency fix (28 Nov)

- The online boss-preparation UI no longer imposes a two-online-player minimum. Once an expedition has started, one fresh member may continue after others disconnect, matching the server-side `cityxiv_boss_start` rule; the initial lobby still requires 2–5 players.
- Source-only patch on the branch; runtime validation still requires Supabase migration and multi-client tests.


## Additional blockers fixed in this audit

- Piazza (stage 0) advancement now requires the first complete three-action round to finish and the automatic enemy-phase RPC to reset actions (round >= 2), in addition to the existing clue/exploration objective. The client button mirrors this gate; the RPC is authoritative.
- The client automatic enemy-turn RPC retries transient failures up to five attempts with capped backoff, then exposes a manual retry control for the host. The retry is keyed by room/round/user and cleared when the phase changes. This is a client source change; it has not been runtime-tested.

### Test cases

- Stage 0 objective met during round 1: advancement must be rejected and the UI button disabled.
- After all active players lock three actions, the no-enemy phase resolves automatically, round increments, and zone advance is allowed if objectives are satisfied.
- Enemy-turn RPC transient error: retries; after five failures, the host can explicitly retry without duplicate round resolution.

These are source-review/test-plan additions only; PostgreSQL and multi-client validation remain pending.

- Overworld joystick and Interagisci controls are also hidden during the automatic enemy phase, preventing movement/interactions while the party turn is locked.


## Stale-member phase stall and heartbeat reconciliation (28 Nov)

### Finding

The action RPC checks phase completion immediately after an action, but the roster is defined by a 90-second heartbeat window. If one member disconnects after using only one or two actions while the other active members have already used all three, the phase could remain `players`: no remaining action could trigger the action RPC's completion check. Heartbeats were updating presence and host handoff, but did not reconcile the phase.

### Fix

Incremental migration `202611280002_cityxiv_ping_phase_reconcile.sql` replaces `cityxiv_ping(uuid)`. After room-first locking and refreshing the caller's presence, the heartbeat checks the active roster during a live `players` phase. If every fresh member has `actions_used >= 3`, it atomically switches the shared state to `enemy`. The check uses the same 90-second roster window, preserves the existing stale-host takeover, and excludes finished/lost expeditions. The host's client then resolves the enemy phase through the existing idempotent RPC.

### Regression matrix

- 2-player room: player A locks 3 actions; player B disconnects at 1 action. After B becomes stale, A's heartbeat moves the phase to `enemy` without another action.
- 5-player room: four members lock 3 actions; the fifth disconnects at 2 actions. Once stale, a heartbeat from a fresh member moves the phase to `enemy`.
- Stale member still fresh (<90s): phase must remain `players` until that member locks 3 actions or becomes stale.
- Reconnect before the stale cutoff: refreshed member remains active and must complete the 3-action lock.
- Reconnect after `enemy` phase begins: no late action is accepted; the enemy phase/reset remains authoritative.
- Concurrent heartbeats: room lock serializes reconciliation; only a phase transition, not a duplicate enemy turn, is stored.

This migration is source-only at this point. It has not been executed against PostgreSQL, rollback-tested, or tested with multiple clients. Apply after migrations `202611270001` and `202611280001` in an authorized Supabase environment, then record the above results before merge.


## UI runtime audit — phase retry hook declaration (28 Nov)

- Found a module-strict-mode runtime error in `CityXIVOnline.jsx`: the `phaseRetry`/`setPhaseRetry` hook was assigned using a bare destructuring assignment after a semicolon, without a `const` declaration. This could throw a `ReferenceError` when the online component renders even though Vite compilation succeeds.
- Fixed it by declaring `const [phaseRetry,setPhaseRetry]=useState(0)` in the component.
- Commit `bc6f889762311d09f072c165127ddcb276ce76b3`.
- This source fix is not yet covered by a fresh Vercel build or live browser/runtime test; it must be checked before release.

- A second bare assignment in the same hook declaration line also left `phaseAttemptRef` and `phaseRetryTimerRef` undeclared. Fixed with explicit `const` declarations in commit `6dac2f47eab5788f33fa74cb269ed229c89d67f1`. Both hook state and retry refs are now declared; still pending a fresh build/runtime check.


## Waiting-lobby stale reservation cleanup (28 Nov)

### Source finding
`cityxiv_join_room` previously counted every persisted lobby row toward room capacity. A member who closed the app without leaving could occupy a slot indefinitely, even after the 90-second heartbeat freshness cutoff. Host reservations could also remain stale.

### Incremental fix
Migration `202611280003_cityxiv_waiting_room_cleanup.sql` replaces the join RPC with a room-locked waiting-room cleanup:
- Refreshes the returning caller before pruning so that their own reservation is preserved.
- Prunes only other reservations whose heartbeat is at least 90 seconds stale, and removes their matching entries from the waiting-room `game_state.players`.
- Re-elects the freshest remaining active member when the waiting-room host is stale/absent; if nobody remains, the incoming member becomes host.
- Enforces capacity against fresh members after the cleanup and creates a fresh member state for a new joiner.
- Leaves `playing` room member rows and state untouched, preserving reconnect after disconnect during an expedition.
- Reapplies authenticated-only RPC execution.

### Regression cases to run
- 2-slot lobby: one stale reservation and one active member; a new player can join and the stale member's player-state key is removed.
- 5-slot lobby: several stale reservations are pruned without exceeding the configured capacity.
- Fresh reservations (<90 seconds) are never pruned; a full fresh lobby still rejects new joiners.
- Stale host with active members: host is transferred to the freshest remaining member.
- Stale host with no remaining members: the incoming joiner becomes host.
- Existing member reconnects: their reservation is refreshed and preserved, including ready state.
- A `playing` room: the join RPC rejects and no stale player rows/state are deleted; reconnect remains through the existing resume/heartbeat flow.
- Concurrent join attempts: room row lock serializes cleanup and capacity checks; room must never exceed `max_players`.

This is source-reviewed only. The migration has not been executed or PostgreSQL-tested; realtime behavior, concurrent joins, and reconnect runtime remain unverified.


## Fresh host selection on explicit leave (28 Nov)

### Finding
The base `cityxiv_leave_room(uuid)` transferred host to the earliest joined reservation without checking heartbeat freshness. If that member had disconnected recently, the party could temporarily lose host-authoritative enemy-turn/advance/boss-start actions until the 90-second freshness cutoff.

### Incremental fix
Migration `202611280004_cityxiv_leave_host_handoff.sql` replaces the leave RPC:
- Room-first lock, authenticated member check and member deletion remain serialized.
- When the host leaves, or the stored host is absent/stale, the freshest remaining member is preferred for host transfer.
- If no fresh member remains, the oldest persisted member is used as a fallback so the room can still resume.
- Removes the leaving member's shared player-state and boss-preparation readiness keys.
- Keeps RPC execution restricted to authenticated users.

### Regression cases
- Host leaves while two or more fresh members remain: the freshest remaining member becomes host.
- Host leaves with no fresh remaining member: fallback member is selected and may take over after reconnect/freshness handling.
- Non-host leaves while the stored host is fresh: host remains unchanged.
- Non-host leaves while stored host is stale/absent: fresh host is elected.
- Leave during boss prep: leaving member is removed from prep readiness; unanimous readiness is evaluated only against the fresh roster.
- Concurrent leave/action/heartbeat: room lock serializes shared state and host changes.

Source-reviewed only; PostgreSQL, concurrent RPC and multi-device runtime validation remain release gates.


## Server-side position rate limit (28 Nov)

### Finding
Position updates were throttled only in the client (about 400 ms). A modified client could bypass that throttle, repeatedly write position rows, and refresh presence through movement requests.

### Fix
Incremental migration `202611280005_cityxiv_position_rate_limit.sql` adds `position_updated_at` and replaces `cityxiv_update_position(uuid,double precision,double precision)`:
- Validates authenticated membership and an active room.
- Rejects non-finite coordinates and clamps finite coordinates to the existing world bounds.
- Uses a room share-lock followed by a member-row lock, matching the room-first order used by state-changing RPCs.
- Enforces a 250 ms server-side minimum interval using `clock_timestamp()` after the row lock (avoiding transaction-start timestamp drift during lock waits); calls inside the interval return `false` without writing.
- Keeps the existing RPC-only authenticated grant.

### Regression cases
- Calls at intervals >=250 ms are accepted; calls inside the interval are rejected without position or heartbeat write.
- Concurrent calls for the same player serialize on the member row and cannot bypass the throttle.
- NaN/Infinity and null coordinates reject; finite out-of-bounds coordinates clamp to the world bounds.
- A non-member and a member in a waiting/finished room cannot update position.
- Room-status transitions serialize with accepted updates.

Source-reviewed only; PostgreSQL syntax/runtime, concurrent calls, and multi-client position sync are not tested. Apply migration `202611280005` after the base migration and incrementals `202611280001`–`202611280004` in the documented order, with a snapshot and rollback plan.


## Contextual recruitment consensus — 28 Nov 2026

Incremental migration `202611280006_cityxiv_recruit_consensus.sql` adds `cityxiv_recruit_offer(uuid,text)` and `cityxiv_recruit_vote(uuid,boolean)` and the mobile vote UI.

- Recruitment is contextual: only during stages 0–2, in the players phase, with no live zone enemy, and for a member whose bench is empty.
- Each member may propose once per zone. Offers are side decisions and do not consume a gameplay action.
- The proposer must explicitly vote yes; all fresh active members (90-second heartbeat window) must vote yes before the server assigns the candidate to the proposer's bench.
- Any no vote vetoes the offer. Candidate IDs are checked against all persisted active/bench state on offer and again at unanimous acceptance.
- The room lock serializes offer/vote changes and shared-state assignment. Stale or stage-mismatched offers are cleared on a new proposal. The RPCs are authenticated and direct client table writes remain revoked.
- The UI hides movement controls while the proposal/vote panel is open and displays the current active-party vote count.

### Source checks performed

- Two RPC definitions found; named dollar delimiters balanced.
- Candidate uniqueness check and proposer/active-roster checks present.
- Client calls both RPCs and exposes proposal and vote UI.
- Static checks passed; these are source checks, not PostgreSQL tests.

### Release gates still outstanding

- Migration 280006 is not applied or PostgreSQL syntax/runtime-tested.
- No 2–5-device voting, stale-member, veto, duplicate candidate or reconnect tests have run.
- No live Supabase migration or rollback has been executed.
- The Vercel preview build for the client patch is pending at audit time.



## Stale recruitment offer visibility fix

- The online UI now checks whether the offer proposer is inside the 90-second fresh roster before showing the vote overlay.
- If a proposer becomes stale, the offer overlay is hidden and another eligible member can initiate a replacement offer; the server RPC clears the stale offer under the room lock before storing the new one.
- This is a source-level UI/backend-consistency fix. It has not been browser-tested with Supabase presence or multi-client reconnects.

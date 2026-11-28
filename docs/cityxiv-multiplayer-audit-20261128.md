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

The incremental SQL is source-reviewed only. It has not been executed or syntax-tested by PostgreSQL, migration applied, rollback tested, or multi-client runtime-tested. Vercel build/deployment for the new commit is not yet verified.

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

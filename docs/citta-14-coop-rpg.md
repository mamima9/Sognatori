# Città XIV — Lumequieto (Co-op RPG)

## Concept
A cooperative story-mode prototype for 2–5 players, inspired by classic exploration RPGs and app-assisted cooperative dungeon adventures.

## First story: The Living Seal
The lights of Lumequieto are fading. A living seal beneath the city is absorbing the residents' dreams. The party explores town, speaks with residents, fights small creatures, recruits a bench Sognatore and enters the archive dungeon to defeat the Seal.

### Story beats / rooms
1. **Piazza delle Lanterne** — hub, dialogue, party setup and story clue.
2. **Bosco dei Sussurri** — minor monster encounters and clues to a missing Sognatore.
3. **Archivio Sommerso** — puzzle rooms, switches and environmental interactions.
4. **Sala del Sigillo** — cooperative turn-based boss encounter.

## Rules
- Party size: 2–5.
- Starter: each player chooses one of the first 29 roster entries.
- Starter Sognatore is story-bound and cannot be traded away.
- Each player can recruit/ train one additional Sognatore as a bench member.
- Each player has 3 actions per round.
- Action options in the prototype: Explore, Talk, Attack, Protect, Switch, Train, Trade.
- Trade cannot involve a player's initial story Sognatore.
- Boss and encounter difficulty should scale by party size, not merely HP: add/remove minions, mechanics, hazards and attack patterns.

## Prototype status
The route `/avventura-coop` is added. This prototype implements a local selection/action UI and a basic boss health demonstration. It is not yet online multiplayer, a graphical tile dungeon, server-persisted progression, or a full combat-engine integration.

## Next implementation stages
1. Online room/session and player synchronization.
2. Shared world-state and action validation on server.
3. Three-action turn scheduler and enemy phase.
4. Dungeon map renderer, rooms, doors, switches, events and NPC dialogues.
5. Existing battle engine integration for attacks, protection, status and switch.
6. Recruit/training persistence, story progress and scaling tests for 2–5.

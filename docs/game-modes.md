# Game modes

Two opt-in modes selected from the **GAME MODE** sheet (top-right of the TV
Guide). Picking a mode hides the lower-third so years/titles aren't spoiled.

## Solo — self-rated guess game

Lean-back single-player mode: listen, guess artist · title · year in your head,
**REVEAL** when ready, then self-rate.

- A bottom-center bar (`GuessGame`) shows the phase CTA:
  `? Reveal` → `✓ I knew it` / `✗ Missed` → `▶ Next track`.
- A correct call extends your **streak**; a miss resets it. Live stats
  (Streak · Best · Played · Hit&nbsp;rate) appear inside the **GAME MODE**
  sheet, analogous to Connected's scoreboard.
- Stats are **cleared each time a new Solo session is started**. Best/streak
  during the current session also persist to `localStorage` (`vktrs-guess`)
  in case the tab is closed mid-game.
- The reveal triggers the regular lower-third slide-in so the answer is
  shown the same way it is in normal playback. The "▶ COMING UP" teaser and
  the screen-reader now-playing announcement stay suppressed so the next
  track isn't spoiled.

Open the sheet (Open button in the bar) and tap **End game** to leave the mode.

## Connected — multi-device WebRTC quiz

Phones join the TV via QR code and submit a **year guess** per round; the
player(s) closest to the actual release year score the point. No hard player
cap is currently enforced in code — practical limit is the PeerJS broker's
connection budget.

- **Host (TV):** opens the GameSheet → the **ROOM** tab shows the room code,
  QR code, join URL and a live players list. The **GAME** tab drives rounds
  (`Start round` → `Reveal (X/Y)` shows submission count → `Next round`),
  ends the game, and edits scores ad hoc.
- Once the sheet is closed, a `FloatingControls` bar (bottom-center) keeps
  the same phase CTA + round indicator + Open affordance visible while
  music plays.
- **Phones (`?join=ABCD`):** thin clients showing room status, a year input
  (clamped to the catalogue's year range), submit + locked-in feedback, and
  the post-reveal card (actual year · track · own guess · winner badge).
- **End of game** → a neo-brutalist winner overlay with confetti glitch and
  the final scoreboard.

### Auto-advance

The GAME tab exposes two independent auto-advance toggles:

- **AUTO-START** (`autoStartRound`, key `vktrs-auto-start`) — automatically
  starts a new round when a fresh track settles into the player (phase
  `idle`). `armAutoStart` in `App.svelte` polls until the track is stable
  before firing (`AUTO_ADVANCE_POLL_MS` cadence, `AUTO_ADVANCE_TRACK_TIMEOUT_MS`
  safety-net timeout).
- **AUTO-CONTINUE** (`autoAdvanceReveal`, key `vktrs-auto-advance`) —
  automatically rolls the next round after the reveal. When active,
  `armAutoContinue` sets a `AUTO_ADVANCE_REVEAL_MS` (6 s) countdown stored in
  the `autoCountdown` writable (`{ endsAt }` or `null`). The host GAME tab
  shows a dashed-border countdown bar ("Next round in Xs") with a **Cancel**
  button that clears the timer. Cancelling also broadcasts an `autocountdown`
  message so delegated controller phones (see below) mirror the cancellation
  immediately.

**Legacy migration.** Before the split, a single toggle stored its value under
`vktrs-auto-advance`. On first load the old value seeds `autoStartRound` (key
`vktrs-auto-start`); `autoAdvanceReveal` reuses the same key and therefore
retains whatever the user had set. This means upgrading users keep their
previous behaviour for both toggles by default.

### Control delegation

The host can hand game controls to exactly one connected phone. Tapping the 🎮
button next to a player in the ROOM tab player list grants that phone the
controller role; tapping it again (or granting another player) revokes it. Only
one controller exists at a time — granting a new one automatically revokes the
previous.

- The host sends a `control` message to the phone's peer id (`{ granted: true
| false }`). When a controller drops and rejoins, `onPeerMessage` re-sends
  `{ granted: true }` automatically so the role survives reconnects.
- **Authorization is host-side**: when the host receives a `command` message it
  checks `players.find(p => p.id === playerId)?.isController` and silently
  drops the message if the sender is not the current controller.
- The designated controller phone gets an additional **control strip** rendered
  above the normal year-guess UI. The strip is phase-aware:
  - `idle` → **Start round**
  - `guessing` → **Reveal** (with a "Reveal now?" confirm overlay when not
    everyone has locked in)
  - `revealed` → **Next round**
  - Secondary row: **Skip song** and **End game** (End requires a confirm
    overlay).
- If AUTO-CONTINUE is running, the controller phone also shows the countdown
  bar ("Next round in Xs") with its own **Cancel** button that sends a
  `command { action: 'cancelCountdown' }` to the host.
- The controller still plays the game normally — they submit a year guess and
  see the reveal card just like any other phone.

Transport: WebRTC P2P via the **PeerJS public broker** (`0.peerjs.com`) for
signaling only — the actual game traffic goes directly between TV and phones
once the handshake is done. The broker is a free, community-run service without
an SLA; if it is rate-limited or down, new rooms cannot be created or joined
until it recovers. Already-connected rooms keep working because the data path
is peer-to-peer. Both peers are created with an explicit `iceServers` list
(`ICE_SERVERS` in `constants.js`) so each device gathers enough candidates to
connect across the network; a same-machine browser tab connects over loopback
and barely needs ICE, which is why that path can "work" while a real phone times
out. The list has two tiers:

- **STUN** (several public servers) discovers each device's public address for a
  direct peer-to-peer path. It does not relay traffic — two devices on the same
  network connect directly and no game data leaves the peers.
- **TURN** (the free OpenRelay/Metered public relay, incl. a `:443?transport=tcp`
  entry for mobile networks that block UDP) is the fallback when no direct path
  exists — chiefly a phone on **mobile data** (carrier-grade / symmetric NAT)
  talking to a TV behind a home router. ICE only uses it when a direct
  connection is impossible, and then the data channel (incl. player names and
  guesses) passes through that third-party server. The public relay is
  best-effort (no SLA, rate limited); for reliable / privacy-controlled use,
  replace the OpenRelay entries with your own TURN credentials (e.g. Cloudflare,
  Metered free tier, or self-hosted [`coturn`](https://github.com/coturn/coturn)).

For broker reliability you can also run your own
[`peerjs-server`](https://github.com/peers/peerjs-server) and pass
`{ host, port, path }` into `new Peer(...)` in `src/lib/multiplayer/peer.js`.

Same Vite bundle for TV and phone; phone mode is triggered by `?join=ABCD` in
the URL. Both `peerjs` and `qrcode` are lazy-loaded so the channel-only path
stays slim.

## Under the hood

- **Pure logic** in `src/lib/`:
  - `game.js` — Solo scoring (`nextGuessStats`, `hitRate`), unit-tested.
  - `multiplayer/state.js` — room reducer (`startSession`, `startRound`,
    `reveal`, `nextRound`, …), pure and unit-tested.
  - `multiplayer/scoring.js` — `closestYearWinners`, unit-tested.
  - `multiplayer/room.js` — room ID generator/validator.
- **Side-effectful**: `multiplayer/peer.js` (PeerJS host/client wrappers),
  `multiplayer/protocol.js` (typed encode/parse, `PROTOCOL_VERSION = 2`).
- **UI**: `components/GuessGame.svelte` (Solo bar), `components/game/`
  (`GameSheet`, `HostRoomView`, `PhoneRoomView`, `FloatingControls`,
  `EndGameCelebration`, `Scoreboard`, `PlayerList`, …).
- **State**: `gameMode`, `room`, `phoneRoom`, `guessStats`, `autoStartRound`,
  `autoAdvanceReveal`, `autoCountdown` stores in `src/lib/stores.js`. Both
  bars share `.game-bar*` classes in `src/app.css`.

### Wire protocol (v2)

All messages are JSON `{ v: 2, type, payload }`. `parseMessage` returns `null`
for any message whose `v` field does not equal `PROTOCOL_VERSION` (currently
`2`) — v2 is **not** back-compatible with v1 clients.

| Direction    | Type            | Payload                                        | Purpose                                                                                                                                                                                               |
| ------------ | --------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| phone → host | `join`          | `{ id, name }`                                 | Phone connects and registers                                                                                                                                                                          |
| phone → host | `guess`         | `{ year }`                                     | Player submits a year guess                                                                                                                                                                           |
| phone → host | `ping`          | `{}`                                           | Heartbeat                                                                                                                                                                                             |
| phone → host | `command`       | `{ action }`                                   | Delegated controller drives the game; `action` ∈ `reveal` · `round` · `skip` · `end` · `cancelCountdown`; the `round` action is phase-aware (starts or advances the round depending on current phase) |
| host → phone | `welcome`       | `{ roomCode, players, session?, scoreboard }`  | Sent on (re)join; includes `isController` per player                                                                                                                                                  |
| host → phone | `round`         | `{ round, phase }`                             | Round state change                                                                                                                                                                                    |
| host → phone | `reveal`        | `{ year, artist, title, winners, scoreboard }` | Reveal result                                                                                                                                                                                         |
| host → phone | `score`         | `{ scoreboard }`                               | Score edit                                                                                                                                                                                            |
| host → phone | `end`           | `{ scoreboard }`                               | Game over                                                                                                                                                                                             |
| host → phone | `kick`          | `{}`                                           | Player removed                                                                                                                                                                                        |
| host → phone | `control`       | `{ granted: boolean }`                         | Grants or revokes the controller role for this phone                                                                                                                                                  |
| host → phone | `autocountdown` | `{ active: boolean, endsAt?: number }`         | Broadcast when AUTO-CONTINUE starts (`active: true, endsAt: <epoch ms>`) or is cancelled (`active: false`); phone mirrors the countdown bar when `isController`                                       |

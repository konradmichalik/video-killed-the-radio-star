# Architecture

## Layout

```
index.html                  entry + PWA/iOS meta + fonts
src/
  main.js                   mounts the Svelte app
  app.css                   global resets, player sizing, .sr-only, .icon-btn
  App.svelte                orchestrator (load, power-on, keyboard, layout)
  lib/
    stores.js               shared reactive state (Svelte stores)
    player.js               YouTube IFrame controller (playlist mode, watchdog…)
    data.js                 load / filter / shuffle / search helpers
    presets.js              data-driven channel presets
    gestures.js             pure tap/swipe resolution
    channel.js              persist the last filter selection
    constants.js            runtime timing values
    game.js                 guess-game scoring (pure)
    a11y.js                 focus-trap / focus-on-mount actions
    wakelock.js             keep the screen awake
    fullscreen.js           fullscreen request
    multiplayer/            Connected-mode WebRTC layer
      state.js              pure room reducer (round / reveal / nextRound)
      scoring.js            closestYearWinners (pure)
      protocol.js           typed encode/parse for peer messages
      peer.js               PeerJS host/client wrappers (side-effectful)
      room.js               room ID generator/validator
      identity.js           phone-side player identity (localStorage)
  components/
    StartScreen · CrtOverlay · ChannelStatic · LowerThird · UpNext
    GuessGame · CenterFeedback · TouchOverlay · StationLogo · DevReview
    UnmuteHint · ErrorScreen · Sheet · Toggle · Guide · Queue · Search
    game/                   Game-mode UI (lazy-loaded multiplayer chunk)
      GameSheet · LazyGameSheet · ModeSelector · HostRoomView
      PhoneRoomView · PhoneShell · FloatingControls · Scoreboard
      PlayerList · RevealOverlay · EndGameCelebration · YearInput
      NetworkBadge
public/
  videos.json               the "database"
  manifest.json             PWA manifest
  icon-*.png                icons
scripts/                    enrich.mjs / verify.mjs (+ seeds, fixtures)
tests/                      Vitest unit tests
.github/workflows/          ci.yml · verify-data.yml · deploy.yml
```

## Conventions

- **`src/components/`** are focused UI pieces. The slide-up panels (Guide, Queue,
  Search) share one **`Sheet.svelte`** wrapper that centralises the dialog role,
  focus trap, `inert` background, slide animation and backdrop-close. The on/off
  switches share **`Toggle.svelte`**; the square icon button is a global
  `.icon-btn`.
- **`src/lib/`** splits pure/testable helpers (`data`, `gestures`, `presets`,
  `game`) from side-effectful modules (`player`, `wakelock`, `fullscreen`,
  `channel`, `a11y`). `player.js` is deliberately one cohesive controller — its
  timers and player handle are private module state that splitting would only
  scatter.
- **`constants.js`** collects runtime timing values in one place. CSS transition
  durations stay in each component's styles; gesture pixel thresholds stay in
  `gestures.js` beside their tests. Visual design tokens live in `:root`
  (`src/app.css`): the three accent roles (now / next / call-to-action) and a
  motion scale (`--dur-fast/ui/panel`) for consistent timing in new work.

## Playback & preloading

The whole queue is handed to the player as a **native YouTube playlist**
(`loadPlaylist` + `setLoop`), so YouTube buffers the next clip ahead of time and
song-to-song transitions are smooth. The current track is matched back to the
queue via `getVideoData().video_id` (robust against skips/re-orders), which
drives the lower third and "coming up" teaser. Manual skips trigger a real load
(masked by channel-change static); natural advances are preloaded and skip it.

## Persistence

Saved to `localStorage`: the last channel (year range + selected genres +
countries), the CRT / SONG INFO / STATION LOGO toggles, and the guess-game
stats. Clearing site data resets everything to defaults.

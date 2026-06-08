# Mobile & iPad hardening

## Gestures & viewport

- `#touch-overlay` sets `touch-action: none` so a vertical swipe is never
  hijacked as a scroll; `pointercancel` and `isPrimary` are handled so
  multi-touch / interrupted gestures don't misfire.
- Viewport is locked (`user-scalable=no`, `viewport-fit=cover`) and the body is
  `overflow: hidden` — it behaves like an app, not a scrollable page.
- Tap the dimmed backdrop to close any panel.

## iPhone notes

iPhone Safari only allows native `<video>` fullscreen, so in a browser tab the
Safari chrome stays visible — **Add to Home Screen** to run standalone for the
real full-screen feel. Two small, non-blocking nudges help here:

- **Rotate hint** — a CSS-only banner shown only on phone-sized screens held in
  portrait (where a 16:9 video letterboxes hard); it disappears on rotation.
- **Install hint** — a one-time, dismissable tip on the start screen, shown only
  on iOS Safari that isn't already standalone (`src/lib/platform.js`,
  unit-tested).

## Robustness

- **Wake Lock** — the screen stays awake during playback
  (`src/lib/wakelock.js`), re-acquired when the tab becomes visible. No-ops
  where unsupported.
- **Fullscreen** — `requestAppFullscreen()` runs inside the "TURN ON TV" tap;
  best-effort with the webkit fallback, swallowed on iPhone where element
  fullscreen isn't allowed.
- **Autoplay fallback** — if sound is blocked, the player retries **muted** and
  shows a one-tap "TAP FOR SOUND" button to unmute.
- **Error / empty states** — an SMPTE-style **test card** ("PLEASE STAND BY / NO
  SIGNAL") appears if `videos.json` fails to load or is empty; a dead-channel
  guard stops the auto-skip loop once every clip in a queue has errored. Picking
  new filters clears it.
- **Player init watchdog** — if the IFrame API is blocked (content blocker) or
  the first clip never starts within ~15 s, the test card is shown instead of a
  silent black screen; a failed API script load is caught immediately.
- **Skip optic** — a manual skip shows a brief black-and-white "snow" burst
  (`ChannelStatic`); natural song-to-song advances are preloaded and skip it.

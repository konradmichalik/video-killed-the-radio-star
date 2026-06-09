# Usage

## Controls

| Gesture                         | Action                |
| ------------------------------- | --------------------- |
| Tap center                      | Play / Pause          |
| Tap right edge / swipe left     | Next video            |
| Tap left edge / swipe right     | Previous video        |
| Swipe up / tap "TV GUIDE" (top) | Open filter menu      |
| Swipe down                      | Re-show the song info |

**Keyboard / remote (desktop):** Space = play/pause · ← → = skip · ↑ = guide ·
`Q` = queue · `/` = search · `I` = reveal info · `M` = mute · `F` = fullscreen ·
Esc = close panel · Enter = turn the TV on. A short legend lives on the start
screen and inside the TV Guide.

## Now playing

The MTV-style lower-third slides in on each track change and once more mid-song,
then tucks away. Swipe down (or press `I`) to summon it again any time. On first
power-on a one-time hint briefly shows the gesture zones.

## TV Guide

The filter menu (swipe up / "TV GUIDE" tab) offers:

- **CHANNELS** — one-tap presets (see below).
- **YEAR RANGE** — dual-range slider.
- **GENRES** — toggle chips, built from the data.
- **ORIGIN** — toggle chips by band country, shown only when the data has
  countries. Entries without a country are never hidden by this filter.
- **CRT / SONG INFO / STATION LOGO** switches.

**PLAY CHANNEL** filters → shuffles → plays the new queue. The video keeps
playing dimmed behind the open guide.

## Channel presets

The **CHANNELS** row sets a year range (and genres/countries) and plays
immediately: _All Time_, _Best of 80s/90s/00s/10s_, genre channels (_Rock
Block_, _Hip-Hop_, _Dance Floor_, _Pop Hits_) and country channels (_British
Invasion_, _Made in USA_, _Euro Wave_, _Down Under_). They're generated from the
data in `src/lib/presets.js` — a preset only appears if matching videos exist,
so the list adapts as `videos.json` changes.

## Search

Press `/` or tap the 🔍 button in the guide header to open the search panel.
Type to get a ranked **autocomplete** list (matches artist, title, year,
country, genre; multi-word is AND; prefix hits rank first). ↑/↓ move the
highlight, Enter or tap plays the picked track immediately — the channel then
continues with a fresh shuffle.

## Queue editor

Open **☰** in the guide header (or press `Q`). The playing track is
highlighted; **▲ / ▼** reorder, **✕** removes (at least one track is kept).
**APPLY QUEUE** reloads the playlist and resumes the current track if it
survived the edit. Queue edits are a one-off tweak and aren't persisted.

## CRT tube filter

A pure-CSS overlay (scanlines, RGB phosphor mask, vignette/curvature, rolling
scan bar, subtle flicker). Toggle it in the guide; the choice is remembered and
it honours `prefers-reduced-motion`. It's non-interactive, so taps/swipes pass
straight through to the controls underneath.

## Coming up

About 14 seconds before a clip ends, an MTV-style "▶ COMING UP" teaser slides in
(top right) announcing the next track. It's suppressed in either game mode so
the next song isn't spoiled — see [game-modes.md](game-modes.md).

## Station bug

A semi-transparent **VKTRS** bug (with an "on air" dot) sits bottom-right during
playback. Toggle it via **STATION LOGO** (remembered).

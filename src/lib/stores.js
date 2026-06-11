import { writable, derived } from 'svelte/store';
import { EMPTY_GUESS_STATS, nextGuessStats } from './game.js';
import { EMPTY_ROOM } from './multiplayer/state.js';

// Boolean settings that should outlive a session. Centralises the try/catch
// dance around localStorage (private-browsing, quota-exceeded) and the
// load+subscribe duplication that used to repeat per setting. Accepts both
// the legacy `'on'/'off'` encoding (older settings) and the canonical
// `'1'/'0'` encoding (newer ones); the first store update after load
// rewrites legacy values to the canonical form.
function persistedBool(key, defaultValue = false) {
  const load = () => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === '1' || raw === 'on') return true;
      if (raw === '0' || raw === 'off') return false;
      return defaultValue;
    } catch {
      return defaultValue;
    }
  };
  const store = writable(load());
  store.subscribe((v) => {
    try {
      localStorage.setItem(key, v ? '1' : '0');
    } catch {
      /* storage unavailable */
    }
  });
  return store;
}

const loadGuessStats = () => {
  try {
    const raw = localStorage.getItem('vktrs-guess');
    return raw ? { ...EMPTY_GUESS_STATS, ...JSON.parse(raw) } : { ...EMPTY_GUESS_STATS };
  } catch {
    return { ...EMPTY_GUESS_STATS };
  }
};

const loadReviews = () => {
  try {
    const raw = localStorage.getItem('vktrs-reviews');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const loadFavorites = () => {
  try {
    const raw = localStorage.getItem('vktrs-favorites');
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

export const videos = writable([]); // all videos from videos.json
export const playlist = writable([]); // current filtered + shuffled queue
export const index = writable(0); // position in playlist
export const started = writable(false); // has the user "turned on the TV"?
export const paused = writable(false);
export const guideOpen = writable(false);
export const queueOpen = writable(false); // queue editor panel
export const searchOpen = writable(false); // search / autocomplete panel
export const settingsOpen = writable(false); // display settings panel (CRT, hints, logo)
export const controlsOpen = writable(false); // keyboard / touch reference panel
export const switching = writable(false); // true while a new video is loading (channel change)
export const crtOn = persistedBool('vktrs-crt', true); // CRT tube filter on/off
export const hintsOn = persistedBool('vktrs-hints', true); // false = guessing mode (hide artist/title/etc.)
export const logoOn = persistedBool('vktrs-logo', true); // semi-transparent station bug on/off
export const progressOn = persistedBool('vktrs-progress', false); // playback progress bar at the bottom
export const playPosition = writable(0); // current playback seconds (set by player.js poll)
export const playDuration = writable(0); // current track duration in seconds
export const showUpNext = writable(false); // "coming up" teaser near the end of a clip
export const reannounce = writable(0); // bump to re-show the lower third mid-song
export const revealHint = writable(0); // bump to reveal the now-playing info once
export const helpHint = writable(0); // bump to re-show the gesture/key cheatsheet
export const loadError = writable(null); // string when the channel can't play (data/dead)
export const needsUnmute = writable(false); // autoplay started muted -> ask for a tap
export const adPlaying = writable(false); // true while YouTube plays a pre-roll / mid-roll ad
// Holds Chrome's captured `beforeinstallprompt` event so the InstallHint can
// trigger the native PWA install prompt on demand. null until Chrome fires it
// (or after the user installs / dismisses).
export const installPromptEvent = writable(null);
// Result of the PeerJS broker pre-flight probe. null = not yet checked,
// true/false = last known reachability. Drives the "Open room" button state
// in ModeSelector and short-circuits the phone-side join when known false.
export const brokerReachable = writable(null);

// User-tagged favourite tracks (Set of video_id). Persisted to localStorage so
// the user can build a long-running personal channel across sessions.
export const favorites = writable(loadFavorites());
// True while the Favorites preset is the active channel — lets Queue act as a
// favourites editor (its remove button also unfavourites in this mode).
export const favoritesMode = writable(false);

/** Toggle a track's favourite status and pulse the centre feedback icon. */
export function toggleFavorite(videoId) {
  if (!videoId) return;
  let wasFav = false;
  favorites.update((s) => {
    wasFav = s.has(videoId);
    const next = new Set(s);
    if (wasFav) next.delete(videoId);
    else next.add(videoId);
    return next;
  });
  feedback.update((f) => ({ icon: wasFav ? 'fav-off' : 'fav-on', n: f.n + 1 }));
}

// pulse signal for the center play/pause feedback icon
export const feedback = writable({ icon: null, n: 0 });

export const currentVideo = derived(
  [playlist, index],
  ([$playlist, $index]) => $playlist[$index] || null,
);

export const upNext = derived([playlist, index], ([$playlist, $index]) =>
  $playlist.length ? $playlist[($index + 1) % $playlist.length] : null,
);

/** Reveal the now-playing lower third once (used by the guessing-mode button). */
export function revealNowPlaying() {
  revealHint.update((n) => n + 1);
}

// Dev-mode video review: per-video annotations matching scripts/verify-videos.md.
export const devMode = writable(false);
export const videoReviews = writable(loadReviews());
// When true, tracks whose review status is exactly `OK` are auto-skipped so the
// user can revisit issue-tagged tracks without sitting through known-good ones.
// Tracks with any other status (or none) keep playing. Persisted across sessions.
export const skipReviewedOk = persistedBool('vktrs-skip-reviewed-ok', false);
// When true, ANY reviewed track (OK or issue) is auto-skipped — only tracks
// with no review status play. Persisted across sessions.
export const skipReviewed = persistedBool('vktrs-skip-reviewed', false);
// Connected mode: when true, the next round auto-starts as soon as the next
// track plays (ad finished, fresh video_id), so the host doesn't have to tap
// "Next round" between every track. Persisted across sessions.
export const autoAdvanceRound = persistedBool('vktrs-auto-advance', false);

/** Merge a partial review for one video_id and persist to localStorage. */
export function updateReview(videoId, partial) {
  if (!videoId) return;
  videoReviews.update((map) => {
    const prev = map[videoId] ?? {};
    return {
      ...map,
      [videoId]: { ...prev, ...partial, reviewedAt: new Date().toISOString() },
    };
  });
}

// Self-rated guessing game: running streak / best / hit-rate, persisted.
export const guessStats = writable(loadGuessStats());

/** Record one self-assessed round (true = "I knew it"). */
export function recordGuess(correct) {
  guessStats.update((s) => nextGuessStats(s, correct));
}

/** Clear streak/best/played/correct — call when a new Solo session starts. */
export function resetGuessStats() {
  guessStats.set({ ...EMPTY_GUESS_STATS });
}

guessStats.subscribe((v) => {
  try {
    localStorage.setItem('vktrs-guess', JSON.stringify(v));
  } catch {
    /* storage unavailable */
  }
});

videoReviews.subscribe((v) => {
  try {
    localStorage.setItem('vktrs-reviews', JSON.stringify(v));
  } catch {
    /* storage unavailable */
  }
});

favorites.subscribe((v) => {
  try {
    localStorage.setItem('vktrs-favorites', JSON.stringify([...v]));
  } catch {
    /* storage unavailable */
  }
});

// 'solo' | 'connected' | null — null means no active game.
export const gameMode = writable(null);

// TV-side room state. Source of truth for the connected game.
export const room = writable(EMPTY_ROOM);

// Phone-side mirror. Slim subset of room + own input state.
export const phoneRoom = writable({
  roomCode: null,
  player: null,
  session: null,
  myScore: 0,
  scoreboard: [],
  mySubmission: null,
  yearRange: { min: 1900, max: new Date().getFullYear() },
  connectionStatus: 'idle', // 'idle' | 'connecting' | 'open' | 'reconnecting' | 'unreachable'
  lastReveal: null, // { year, title, artist, winners, submissions } — set on reveal, cleared on next round
});

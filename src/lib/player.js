import { get } from 'svelte/store';
import {
  playlist,
  index,
  paused,
  feedback,
  switching,
  showUpNext,
  reannounce,
  loadError,
  needsUnmute,
  playPosition,
  playDuration,
  adPlaying,
  gameMode,
  room,
} from './stores.js';
import {
  UPNEXT_LEAD_S,
  REANNOUNCE_AT_S,
  REANNOUNCE_MIN_REMAINING_S,
  AUTOPLAY_GRACE_MS,
  INIT_WATCHDOG_MS,
  SWITCH_MASK_MS,
  ENDED_FALLBACK_MS,
  POLL_INTERVAL_MS,
  END_PREEMPT_S,
  ERROR_SKIP_MS,
} from './constants.js';

let player = null;
let ready = false;
let switchTimer = null;
let pollTimer = null;
let endedSafety = null;
let upNextArmed = true; // re-armed on each track; fires the "coming up" teaser once
let reannounceArmed = true; // re-armed on each track; re-shows the lower third once
let endPreemptArmed = true; // re-armed on each track; advances before YT's end overlay
let errorCount = 0; // consecutive playback errors -> dead-channel guard
let autoplayChecked = false; // run the muted-autoplay fallback only once
let initWatchdog = null; // surfaces an error if the player never starts
let playedOnce = false;

const PLAYER_VARS = {
  autoplay: 1,
  controls: 0,
  modestbranding: 1,
  rel: 0,
  disablekb: 1,
  iv_load_policy: 3,
  fs: 0,
  playsinline: 1,
  enablejsapi: 1,
};

// Show the "channel change" static while a new video loads. Cleared when the
// video actually starts PLAYING, with a safety timeout so it can never stick.
function beginSwitch() {
  switching.set(true);
  clearTimeout(switchTimer);
  switchTimer = setTimeout(() => switching.set(false), SWITCH_MASK_MS);
}
function endSwitch() {
  clearTimeout(switchTimer);
  switching.set(false);
}

// Surfaces the test card if the player never starts (e.g. the IFrame API is
// blocked and silently never calls onYouTubeIframeAPIReady, or the first video
// never reaches PLAYING). Cleared on the first PLAYING.
export function armInitWatchdog(ms = INIT_WATCHDOG_MS) {
  playedOnce = false;
  clearTimeout(initWatchdog);
  initWatchdog = setTimeout(() => {
    if (!playedOnce) {
      endSwitch();
      loadError.set(
        'The video player could not start — check your connection or any content blockers.',
      );
    }
  }, ms);
}

export function loadYouTubeAPI() {
  return new Promise((resolve, reject) => {
    if (window.YT && window.YT.Player) return resolve();
    window.onYouTubeIframeAPIReady = resolve;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.onerror = () => reject(new Error('YouTube IFrame API failed to load'));
    document.head.appendChild(tag);
  });
}

export function createPlayer(nodeId) {
  beginSwitch(); // mask the initial load too
  errorCount = 0;
  loadError.set(null);
  player = new YT.Player(nodeId, {
    // Privacy-enhanced mode (youtube-nocookie.com). Reduces tracking cookies
    // and in some cases shortens/limits pre-roll ads on third-party embeds.
    // YouTube does not allow embed-side ad suppression beyond this on free
    // accounts — full ad-free requires YouTube Premium per viewer.
    host: 'https://www.youtube-nocookie.com',
    // Non-revealing iframe title. The browser tooltip shown on hover would
    // otherwise leak the current video title and ruin the guess game.
    title: 'VKTRS player',
    playerVars: PLAYER_VARS,
    events: {
      onReady: () => {
        ready = true;
        stripIframeTitle();
        loadQueue(get(index)); // hand YouTube the whole queue as a real playlist
        startUpNextPoll();
        // iOS autoplay fallback: if nothing is playing shortly after a gesture,
        // retry muted (always allowed) and ask the user for one tap for sound.
        setTimeout(checkAutoplay, AUTOPLAY_GRACE_MS);
      },
      onStateChange: onStateChange,
      onError: handleError,
    },
  });
}

// Belt-and-braces: the IFrame API `title` option above usually sticks, but
// YouTube has been known to overwrite it as videos change. Strip the title
// attribute outright so the browser never shows the current video title in a
// hover tooltip (which would defeat the guess game).
function stripIframeTitle() {
  // The IFrame API replaces the mount <div id="player"> with the iframe itself,
  // so #player IS the iframe after onReady. Fall back to a nested lookup just
  // in case YouTube ever wraps the iframe in a container.
  const root = document.getElementById('player');
  const iframe = root?.tagName === 'IFRAME' ? root : root?.querySelector('iframe');
  if (iframe) iframe.removeAttribute('title');
}

// Load the current queue as a native YouTube playlist. YouTube then buffers the
// next item ahead of time, so end-of-song transitions are smooth (real preload).
// `resume` keeps the currently-playing track near its position (used after the
// user edits the queue) instead of restarting it from the top.
export function loadQueue(startIndex = 0, resume = false) {
  const list = get(playlist);
  if (!ready || !player || !list.length) return;
  const startSeconds =
    resume && typeof player.getCurrentTime === 'function' ? player.getCurrentTime() : 0;
  upNextArmed = true;
  adPlaying.set(false);
  showUpNext.set(false);
  beginSwitch();
  player.loadPlaylist(
    list.map((v) => v.video_id),
    startIndex,
    startSeconds,
  );
  player.setLoop(true); // continuous channel
}

// Connected Mode pins the current track on the TV between Start Round and
// Reveal/Next. Manual user skips (next()/prev()) are NOT affected.
function autoAdvanceBlocked() {
  return get(gameMode) === 'connected' && get(room).session?.phase === 'guessing';
}

function onStateChange(e) {
  const S = YT.PlayerState;
  if (e.data === S.PLAYING) {
    paused.set(false);
    endSwitch();
    errorCount = 0;
    playedOnce = true;
    clearTimeout(initWatchdog);
    // YouTube re-applies the iframe's title on track change, so strip it again.
    // setTimeout(0) lets YT finish its DOM update before we override it.
    setTimeout(stripIframeTitle, 0);
    syncIndex();
  } else if (e.data === S.PAUSED) {
    paused.set(true);
  } else if (e.data === S.ENDED) {
    // Connected game mode pins the current track on the TV until the host
    // taps Reveal/Next, so suppress every auto-advance path while guessing.
    if (autoAdvanceBlocked()) return;
    // native advance + loop should handle this; safety net if it doesn't
    clearTimeout(endedSafety);
    endedSafety = setTimeout(() => {
      if (player && player.getPlayerState() === S.ENDED) next();
    }, ENDED_FALLBACK_MS);
  }
}

// Keep our metadata in sync with whatever YouTube is actually playing. Matching
// by video_id (not just the playlist index) survives skips/re-orders.
function syncIndex() {
  if (!player) return;
  const data = typeof player.getVideoData === 'function' ? player.getVideoData() : null;
  const list = get(playlist);
  let i = data && data.video_id ? list.findIndex((t) => t.video_id === data.video_id) : -1;
  if (i < 0 && typeof player.getPlaylistIndex === 'function') i = player.getPlaylistIndex();
  if (i < 0) return;
  if (i !== get(index)) {
    upNextArmed = true; // re-arm the "coming up" teaser for the new track
    reannounceArmed = true; // re-arm the mid-song lower-third re-show
    endPreemptArmed = true; // re-arm the end preempt
    showUpNext.set(false);
    playPosition.set(0); // progress bar resets to the left edge on track change
    playDuration.set(0);
  }
  index.set(i);
}

// Announce the next clip ~UPNEXT_LEAD_S seconds before the end, MTV style.
function startUpNextPoll() {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    if (!ready || !player || typeof player.getDuration !== 'function') return;
    const dur = player.getDuration();
    const cur = typeof player.getCurrentTime === 'function' ? player.getCurrentTime() : 0;
    playPosition.set(cur);
    playDuration.set(dur);

    // Ad detection — two signals combined because YouTube does not always
    // swap getVideoData().video_id during ads.
    //  1) video_id mismatch (when YT does swap it for the ad)
    //  2) duration heuristic: pre-roll ads are typically 5–30 s, music
    //     videos almost always > 45 s
    const data = typeof player.getVideoData === 'function' ? player.getVideoData() : null;
    const expected = get(playlist)[get(index)]?.video_id;
    const idMismatch = !!(data && data.video_id && expected && data.video_id !== expected);
    const suspiciouslyShort = dur > 0 && dur < 45;
    adPlaying.set(idMismatch || suspiciouslyShort);
    if (dur > 0 && upNextArmed && dur - cur <= UPNEXT_LEAD_S) {
      upNextArmed = false;
      showUpNext.set(true);
    }
    // re-show the lower third once, mid-song, MTV style — but only with enough
    // time left that it won't collide with the "coming up" teaser
    if (
      dur > 0 &&
      reannounceArmed &&
      cur >= REANNOUNCE_AT_S &&
      dur - cur >= REANNOUNCE_MIN_REMAINING_S
    ) {
      reannounceArmed = false;
      reannounce.update((n) => n + 1);
    }
    // Preempt the natural end so YouTube's "more videos" overlay never appears.
    // Skips to the next clip ~END_PREEMPT_S seconds early; the channel-change
    // static masks the gap so the transition still feels smooth.
    if (dur > 0 && endPreemptArmed && dur - cur <= END_PREEMPT_S) {
      // While Connected guessing is active, pin the track for the players.
      if (autoAdvanceBlocked()) return;
      endPreemptArmed = false;
      next();
    }
  }, POLL_INTERVAL_MS);
}

export function next() {
  if (!ready || !player) return;
  showUpNext.set(false);
  beginSwitch();
  player.nextVideo();
}

export function prev() {
  if (!ready || !player) return;
  showUpNext.set(false);
  beginSwitch();
  player.previousVideo();
}

export function toggle() {
  if (!ready || !player) return;
  if (get(paused)) {
    player.playVideo();
    pulse('play');
  } else {
    player.pauseVideo();
    pulse('pause');
  }
}

// Debug helper — snapshot what YouTube reports right now. Exposed via
// window.vktrsPlayerState() in App.svelte so the user can verify ad
// detection from the browser console.
export function debugPlayerState() {
  if (!ready || !player) return { ready: false };
  return {
    ready: true,
    state: player.getPlayerState?.(),
    videoData: player.getVideoData?.(),
    currentTime: player.getCurrentTime?.(),
    duration: player.getDuration?.(),
    playlistIndex: player.getPlaylistIndex?.(),
    expected: get(playlist)[get(index)]?.video_id,
    adPlaying: get(adPlaying),
  };
}

// Relative seek by `delta` seconds. Clamped to [0, duration] when known. Used
// by the dev-review panel to scrub through a track during verification.
export function seekBy(delta) {
  if (!ready || !player || typeof player.seekTo !== 'function') return;
  const cur = typeof player.getCurrentTime === 'function' ? player.getCurrentTime() : 0;
  const dur = typeof player.getDuration === 'function' ? player.getDuration() : 0;
  let target = cur + delta;
  if (target < 0) target = 0;
  if (dur > 0 && target > dur - 1) target = Math.max(0, dur - 1);
  player.seekTo(target, true);
}

// embedding disabled / removed video -> skip; but stop after a full lap so a
// fully-dead channel surfaces an error instead of looping forever.
function handleError() {
  errorCount += 1;
  const len = get(playlist).length || 1;
  if (errorCount >= len) {
    endSwitch();
    loadError.set('No playable videos in this channel — try other filters.');
    return;
  }
  setTimeout(next, ERROR_SKIP_MS);
}

function checkAutoplay() {
  if (autoplayChecked || !player || typeof player.getPlayerState !== 'function') return;
  autoplayChecked = true;
  const state = player.getPlayerState();
  // 1 = playing, 3 = buffering -> autoplay is fine
  if (state !== 1 && state !== 3) {
    try {
      player.mute();
      player.playVideo();
      needsUnmute.set(true);
    } catch {
      /* nothing more we can do */
    }
  }
}

export function unmute() {
  if (player && typeof player.unMute === 'function') player.unMute();
  needsUnmute.set(false);
}

export function toggleMute() {
  if (!player || typeof player.isMuted !== 'function') return;
  if (player.isMuted()) {
    player.unMute();
    needsUnmute.set(false);
  } else {
    player.mute();
  }
}

// Reset the dead-channel guard (e.g. when the user picks new filters).
export function resetErrors() {
  errorCount = 0;
  loadError.set(null);
}

function pulse(icon) {
  feedback.update((f) => ({ icon, n: f.n + 1 }));
}

// Centralised timing values for runtime behaviour. Kept in one place so the
// "feel" of the channel can be tuned without hunting through modules.
// (CSS transition durations live in each component's <style>; gesture pixel
// thresholds live in gestures.js next to the logic and tests that use them.)

// --- Player (player.js) ---
export const UPNEXT_LEAD_S = 14; // seconds before the end to announce the next clip
export const REANNOUNCE_AT_S = 45; // re-show the lower third this far into a track
export const REANNOUNCE_MIN_REMAINING_S = 30; // ...only if at least this much is left
export const AUTOPLAY_GRACE_MS = 2500; // wait before assuming autoplay was blocked
export const INIT_WATCHDOG_MS = 45000; // show the test card if playback never starts (allow pre-roll ads + consent banner)
export const SWITCH_MASK_MS = 4000; // max time the channel-change static is shown
export const ENDED_FALLBACK_MS = 2000; // safety advance if native ENDED handling stalls
export const POLL_INTERVAL_MS = 1000; // cadence of the up-next progress poll
export const END_PREEMPT_S = 1.5; // advance this far before natural end to avoid YT's "more videos" overlay
export const ERROR_SKIP_MS = 600; // pause before auto-skipping a failed video

// --- UI ---
export const LOWER_THIRD_MS = 7000; // how long the song lower-third stays visible
export const LOWER_THIRD_TRACK_CHANGE_DELAY_MS = 2000; // wait this long after a track change before auto-showing the lower third — lets the music play for a beat first (MTV "guess the song" feel)

// --- Connected Game Mode ---
export const PEER_CONNECT_TIMEOUT_MS = 8000; // give up establishing a peer connection after this long
export const PEER_RECONNECT_BACKOFF_MS = [1000, 3000, 9000]; // delays before each reconnect attempt
// ICE servers for the WebRTC peer connection. PeerJS's bundled default is a
// single Google STUN entry; this list adds several reputable public STUN
// servers plus a TURN relay.
//
// STUN lets each device discover its public address so peers can connect
// directly — enough for two devices on the same network. It does NOT relay
// traffic, so when a direct path exists no game data leaves the peers (ICE
// always prefers a direct candidate over the relay).
//
// TURN is the fallback for when no direct path exists — chiefly a phone on
// mobile data (carrier-grade / symmetric NAT) talking to the TV behind a home
// router. There the relay carries the data channel, so game traffic (incl.
// player names and guesses) passes through this third-party server. We use the
// free, no-signup OpenRelay/Metered public TURN; the credentials below are
// theirs and publicly documented, not secrets. It is best-effort (no SLA, rate
// limited) — swap in your own TURN credentials for reliable production use. The
// :443?transport=tcp entry matters on mobile networks that block UDP: TURN then
// tunnels over TCP/443 and looks like ordinary HTTPS.
const OPENRELAY = { username: 'openrelayproject', credential: 'openrelayproject' };
export const ICE_SERVERS = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'turn:openrelay.metered.ca:80', ...OPENRELAY },
  { urls: 'turn:openrelay.metered.ca:443', ...OPENRELAY },
  { urls: 'turn:openrelay.metered.ca:443?transport=tcp', ...OPENRELAY },
];
export const MAX_PLAYERS = 16; // hard cap on players per room
export const PLAYER_DISCONNECT_TIMEOUT_MS = 60000; // drop a player after this long without heartbeat
export const AUTO_ADVANCE_REVEAL_MS = 6000; // with AUTO NEXT ROUND on, how long the reveal stays before rolling the next round
export const AUTO_ADVANCE_POLL_MS = 300; // cadence while waiting for the fresh track to settle before auto-starting the round
export const AUTO_ADVANCE_TRACK_TIMEOUT_MS = 20000; // safety net: start the next round anyway if a fresh non-ad track never settles (e.g. long/stuck pre-roll)

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

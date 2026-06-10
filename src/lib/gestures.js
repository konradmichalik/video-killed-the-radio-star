/**
 * Pure gesture resolution — no DOM, no side effects, fully unit-testable.
 * This is the heart of the mobile UX, so it lives on its own and is covered
 * by tests in tests/gestures.test.js.
 */

export const SWIPE = 45; // px a finger must travel to count as a swipe
export const TAP_MOVE = 12; // px of slop still allowed for a "tap"
export const TOP_UI_STRIP_PX = 100; // top zone reserved for logo button / guess-game UI — taps here resolve to null
export const LONG_PRESS_MS = 700; // hold this long with no movement to toggle the current track as favourite
// Vertical inset (top AND bottom, symmetric) the prev/next edge-tap zones are
// pulled in by, as a fraction of viewport height. 0.25 means the active band
// runs from 25% to 75% of the height. Outside that band the corners stay free
// for the station bug, floating controls and any future top/bottom UI strip,
// and a thumb resting near the screen edge can't accidentally skip a track.
export const EDGE_ZONE_VERTICAL_INSET_FRAC = 0.25;

/**
 * Decide what a pointer interaction means.
 *
 * @param {object} p
 * @param {number} p.startX  pointer x at press
 * @param {number} p.startY  pointer y at press
 * @param {number} p.endX    pointer x at release
 * @param {number} p.endY    pointer y at release
 * @param {number} p.viewportWidth  window.innerWidth
 * @param {number} [p.viewportHeight] window.innerHeight — used for the vertical band on edge taps; falls back to "always in band" when 0/undefined.
 * @param {number} [p.duration]     ms held between down and up — long-press detection
 * @returns {'next'|'prev'|'guide'|'info'|'toggle'|'favorite'|null}
 */
export function resolveGesture({
  startX,
  startY,
  endX,
  endY,
  viewportWidth,
  viewportHeight,
  duration,
}) {
  const dx = endX - startX;
  const dy = endY - startY;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  // --- SWIPE ---
  if (absX > SWIPE || absY > SWIPE) {
    if (absX > absY) {
      // Horizontal swipe must originate in the matching half: a swipe that
      // starts on the right and moves leftward is "push the current track
      // away → next"; a swipe that starts on the left and moves rightward is
      // "pull the previous track in → prev". Wrong-half drifts (e.g. thumb
      // sliding back) return null so they don't trigger accidental skips.
      const startedLeftHalf = startX < viewportWidth / 2;
      if (!startedLeftHalf && dx < 0) return 'next';
      if (startedLeftHalf && dx > 0) return 'prev';
      return null;
    }
    return dy < 0 ? 'guide' : 'info'; // up -> guide, down -> re-show song info
  }

  // --- TAP / LONG-PRESS (movement stayed within slop) ---
  if (absX <= TAP_MOVE && absY <= TAP_MOVE) {
    // Top strip is reserved for the station logo button and the guess-game
    // controls (Reveal / I knew it). Don't fire prev/next/toggle there — let
    // any underlying button at z-index > 10 catch the click instead.
    if (endY < TOP_UI_STRIP_PX) return null;
    // Long press anywhere outside the top strip = toggle favourite
    if (duration && duration >= LONG_PRESS_MS) return 'favorite';
    const zone = endX / viewportWidth;
    // Edge prev/next zones are restricted to a vertical mid-band so the
    // corners (where station bug, floating controls, etc. live) stay neutral.
    const yFrac = viewportHeight > 0 ? endY / viewportHeight : 0.5;
    const inEdgeBand =
      yFrac > EDGE_ZONE_VERTICAL_INSET_FRAC && yFrac < 1 - EDGE_ZONE_VERTICAL_INSET_FRAC;
    if (zone < 0.25) return inEdgeBand ? 'prev' : null;
    if (zone > 0.75) return inEdgeBand ? 'next' : null;
    return 'toggle'; // center
  }

  // ambiguous medium-distance move -> ignore
  return null;
}

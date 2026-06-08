/**
 * Pure gesture resolution — no DOM, no side effects, fully unit-testable.
 * This is the heart of the mobile UX, so it lives on its own and is covered
 * by tests in tests/gestures.test.js.
 */

export const SWIPE = 60; // px a finger must travel to count as a swipe
export const TAP_MOVE = 12; // px of slop still allowed for a "tap"

/**
 * Decide what a pointer interaction means.
 *
 * @param {object} p
 * @param {number} p.startX  pointer x at press
 * @param {number} p.startY  pointer y at press
 * @param {number} p.endX    pointer x at release
 * @param {number} p.endY    pointer y at release
 * @param {number} p.viewportWidth  window.innerWidth
 * @returns {'next'|'prev'|'guide'|'info'|'toggle'|null}
 */
export function resolveGesture({ startX, startY, endX, endY, viewportWidth }) {
  const dx = endX - startX;
  const dy = endY - startY;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  // --- SWIPE ---
  if (absX > SWIPE || absY > SWIPE) {
    if (absX > absY) {
      return dx < 0 ? 'next' : 'prev'; // left -> next, right -> prev
    }
    return dy < 0 ? 'guide' : 'info'; // up -> guide, down -> re-show song info
  }

  // --- TAP (movement stayed within slop) ---
  if (absX <= TAP_MOVE && absY <= TAP_MOVE) {
    const zone = endX / viewportWidth;
    if (zone < 0.25) return 'prev'; // left edge
    if (zone > 0.75) return 'next'; // right edge
    return 'toggle'; // center
  }

  // ambiguous medium-distance move -> ignore
  return null;
}

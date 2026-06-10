import { describe, it, expect } from 'vitest';
import { resolveGesture, SWIPE, TAP_MOVE } from '../src/lib/gestures.js';

const VW = 1000;
const VH = 1000;
// Default helper places y=400 (inside the 0.25–0.75 vertical band of a 1000-px
// viewport) so the existing edge-tap tests still resolve to prev/next.
const g = (startX, startY, endX, endY) =>
  resolveGesture({ startX, startY, endX, endY, viewportWidth: VW, viewportHeight: VH });

describe('swipes', () => {
  it('leftward swipe in right half -> next', () => {
    expect(g(800, 400, 800 - (SWIPE + 20), 405)).toBe('next');
  });

  it('rightward swipe in left half -> prev', () => {
    expect(g(200, 400, 200 + (SWIPE + 20), 405)).toBe('prev');
  });

  it('leftward swipe in left half -> null (wrong half)', () => {
    // Thumb drifting back inward after a tap shouldn't skip a track.
    expect(g(200, 400, 200 - (SWIPE + 20), 405)).toBeNull();
  });

  it('rightward swipe in right half -> null (wrong half)', () => {
    expect(g(800, 400, 800 + (SWIPE + 20), 405)).toBeNull();
  });

  it('swipe up -> guide', () => {
    expect(g(500, 400, 505, 400 - (SWIPE + 20))).toBe('guide');
  });

  it('swipe down -> info (re-show song info)', () => {
    expect(g(500, 400, 505, 400 + (SWIPE + 20))).toBe('info');
  });

  it('diagonal but mostly horizontal in right half -> next', () => {
    // dx = -80 (>SWIPE), dy = -70; |dx| > |dy| AND started in right half => next
    expect(g(800, 400, 720, 330)).toBe('next');
  });

  it('diagonal but mostly vertical up -> guide', () => {
    // dx = 70, dy = -80; |dy| > |dx| and up => guide
    expect(g(500, 400, 570, 320)).toBe('guide');
  });
});

describe('taps by zone', () => {
  it('center tap -> toggle', () => {
    expect(g(500, 400, 503, 402)).toBe('toggle');
  });

  it('left-edge tap -> prev', () => {
    expect(g(100, 400, 100, 400)).toBe('prev'); // zone 0.1
  });

  it('right-edge tap -> next', () => {
    expect(g(900, 400, 900, 400)).toBe('next'); // zone 0.9
  });

  it('zone boundary 0.25 counts as center (not prev)', () => {
    expect(g(250, 400, 250, 400)).toBe('toggle');
  });

  it('tiny jitter within slop still a tap', () => {
    expect(g(500, 400, 500 + TAP_MOVE, 400 + TAP_MOVE)).toBe('toggle');
  });
});

describe('edge-tap vertical band', () => {
  it('left-edge tap near the top (above band) -> null (falls through)', () => {
    // y = 150, viewportHeight 1000 -> yFrac 0.15, outside 0.25–0.75 band
    expect(g(100, 150, 100, 150)).toBeNull();
  });

  it('right-edge tap near the bottom (below band) -> null', () => {
    // y = 850, yFrac 0.85 -> outside band
    expect(g(900, 850, 900, 850)).toBeNull();
  });

  it('center tap outside the band still toggles (no vertical restriction)', () => {
    // Centre column is unaffected by the edge band — toggle play/pause works
    // anywhere outside the top UI strip.
    expect(g(500, 200, 500, 200)).toBe('toggle');
    expect(g(500, 800, 500, 800)).toBe('toggle');
  });
});

describe('ambiguous moves', () => {
  it('medium move (between tap slop and swipe threshold) -> null', () => {
    expect(g(500, 400, 530, 430)).toBeNull();
  });
});

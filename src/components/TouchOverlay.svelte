<script>
  import { fade } from 'svelte/transition';
  import { guideOpen, revealNowPlaying, paused, adPlaying } from '../lib/stores.js';
  import { next, prev, toggle } from '../lib/player.js';
  import { resolveGesture } from '../lib/gestures.js';

  let startX = 0;
  let startY = 0;
  let tracking = false;

  // Mouse-only: show edge hints so desktop users can tell where prev/next
  // tap targets actually live (left and right 25% — see lib/gestures.js).
  // Hidden while a drag is in progress; cleared on pointer leave.
  let hoverZone = null; // 'prev' | 'center' | 'next' | null

  function down(e) {
    if (!e.isPrimary) return; // ignore secondary touches (pinch etc.)
    tracking = true;
    startX = e.clientX;
    startY = e.clientY;
    hoverZone = null;
  }

  function up(e) {
    if (!tracking || !e.isPrimary) return;
    tracking = false;

    const action = resolveGesture({
      startX,
      startY,
      endX: e.clientX,
      endY: e.clientY,
      viewportWidth: window.innerWidth,
    });

    if (action === 'next') next();
    else if (action === 'prev') prev();
    else if (action === 'guide') guideOpen.set(true);
    else if (action === 'info') revealNowPlaying();
    else if (action === 'toggle') toggle();
  }

  function cancel() {
    tracking = false;
    hoverZone = null;
  }

  function move(e) {
    if (e.pointerType !== 'mouse' || tracking) return;
    const x = e.clientX / window.innerWidth;
    const z = x < 0.25 ? 'prev' : x > 0.75 ? 'next' : 'center';
    if (z !== hoverZone) hoverZone = z;
  }

  function leave() {
    hoverZone = null;
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  id="touch-overlay"
  class:passthrough={$adPlaying}
  on:pointerdown={down}
  on:pointerup={up}
  on:pointercancel={cancel}
  on:pointermove={move}
  on:pointerleave={leave}
></div>

{#if hoverZone === 'prev'}
  <span class="edge-hint left" aria-hidden="true" transition:fade={{ duration: 140 }}>◀ PREV</span>
{:else if hoverZone === 'next'}
  <span class="edge-hint right" aria-hidden="true" transition:fade={{ duration: 140 }}>NEXT ▶</span>
{:else if hoverZone === 'center' && $paused}
  <!-- center hint only when paused — otherwise the running video would have
       a persistent "TAP · PLAY / PAUSE" label hovering over its middle -->
  <span class="edge-hint center" aria-hidden="true" transition:fade={{ duration: 140 }}
    >TAP · PLAY</span
  >
{/if}

<style>
  #touch-overlay {
    position: absolute;
    inset: 0;
    z-index: 10;
    background: transparent;
    touch-action: none; /* we own the gestures; stop the browser scrolling/zooming */
  }
  /* While YouTube plays an ad, let clicks fall through to the iframe so the
     user can hit YouTube's own "Skip Ad" button or interact with consent banners.
     Our gestures are disabled for ~15 s — small price for being able to skip ads. */
  #touch-overlay.passthrough {
    pointer-events: none;
    touch-action: auto;
  }
  /* Mouse-hover edge hints — visual only, never block taps. */
  .edge-hint {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 11;
    pointer-events: none;
    font-family: 'VT323', monospace;
    font-size: clamp(15px, 2.2vw, 22px);
    letter-spacing: 3px;
    color: rgba(255, 255, 255, 0.9);
    background: rgba(0, 0, 0, 0.55);
    padding: 8px 16px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    text-shadow: 0 1px 8px rgba(0, 0, 0, 0.9);
    white-space: nowrap;
  }
  .edge-hint.left {
    left: clamp(18px, 4vw, 56px);
  }
  .edge-hint.right {
    right: clamp(18px, 4vw, 56px);
  }
  .edge-hint.center {
    left: 50%;
    transform: translate(-50%, -50%);
    color: #fff;
    background: rgba(0, 0, 0, 0.5);
  }
  /* Touch-only devices never get hover events — keep these out of the DOM
     defensively via a media-query opacity zero so even a stuck state is hidden. */
  @media (hover: none) {
    .edge-hint {
      display: none;
    }
  }
</style>

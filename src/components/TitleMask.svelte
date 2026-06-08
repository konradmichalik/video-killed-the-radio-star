<script>
  import { fade } from 'svelte/transition';
  import { hintsOn } from '../lib/stores.js';
</script>

{#if !$hintsOn}
  <div class="title-mask" aria-hidden="true" transition:fade={{ duration: 200 }}></div>
{/if}

<style>
  /* Hides YouTube's own title overlay (top-left) while in guess mode.
     Sits above the iframe but below GuideTab/HelpButton (z 8) and the
     transparent TouchOverlay (z 10), so gestures still pass through. */
  .title-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: clamp(72px, 14vh, 140px);
    z-index: 6;
    pointer-events: none;
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.96) 0%,
      rgba(0, 0, 0, 0.85) 55%,
      rgba(0, 0, 0, 0) 100%
    );
  }
</style>

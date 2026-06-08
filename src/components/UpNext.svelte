<script>
  import { fly } from 'svelte/transition';
  import { upNext, showUpNext, hintsOn } from '../lib/stores.js';
</script>

{#if $showUpNext && $hintsOn && $upNext}
  <div class="up-next" transition:fly={{ x: 80, duration: 450 }}>
    <span class="kicker">▶ COMING UP</span>
    <span class="artist">{$upNext.artist}</span>
    <span class="title">{$upNext.title}</span>
  </div>
{/if}

<style>
  .up-next {
    position: absolute;
    top: calc(clamp(40px, 8vh, 80px) + env(safe-area-inset-top, 0px));
    right: env(safe-area-inset-right, 0px);
    z-index: 8;
    pointer-events: none;
    text-align: right;
    padding: 10px 20px 12px 28px;
    background: linear-gradient(270deg, rgba(0, 0, 0, 0.82) 0%, rgba(0, 0, 0, 0.45) 100%);
    border-right: 10px solid var(--accent-2);
    box-shadow: 0 0 18px rgba(8, 217, 214, 0.4);
  }
  .kicker {
    display: block;
    font-family: 'VT323', monospace;
    font-size: clamp(14px, 1.8vw, 20px);
    letter-spacing: 3px;
    color: var(--accent-2);
    text-shadow: 0 0 10px var(--accent-2);
  }
  .artist {
    display: block;
    font-family: 'Anton', sans-serif;
    font-size: clamp(20px, 3.2vw, 38px);
    line-height: 1.05;
    text-transform: uppercase;
    margin-top: 2px;
  }
  .title {
    display: block;
    font-family: 'Archivo', sans-serif;
    font-weight: 700;
    font-size: clamp(13px, 1.8vw, 20px);
    color: #fff;
    opacity: 0.85;
  }
</style>

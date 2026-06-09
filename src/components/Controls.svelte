<script>
  import { controlsOpen } from '../lib/stores.js';
  import Sheet from './Sheet.svelte';
</script>

<Sheet
  open={$controlsOpen}
  label="Controls reference"
  accent="var(--bug-yellow)"
  on:close={() => controlsOpen.set(false)}
>
  <svelte:fragment slot="title">
    <span class="sheet-wordmark" aria-hidden="true">
      <span class="sheet-wm-1">VIDEO KILLED</span>
      <span class="sheet-wm-2">THE RADIO STAR</span>
    </span>
    <span class="sheet-subheading">CONTROLS</span>
  </svelte:fragment>

  <section class="block">
    <span class="label">TOUCH</span>
    <dl class="rows">
      <dt>Tap centre</dt>
      <dd>Play / pause</dd>
      <dt>Tap edge × 2</dt>
      <dd>Previous / next track</dd>
      <dt>Long-press edge</dt>
      <dd>Seek -10 s / +10 s (repeats while held)</dd>
      <dt>Long-press centre</dt>
      <dd>Toggle ★ favourite for current track</dd>
      <dt>Swipe ▲</dt>
      <dd>Open TV Guide</dd>
      <dt>Swipe ▼</dt>
      <dd>Show song info</dd>
      <dt>Swipe ◀ / ▶</dt>
      <dd>Previous / next track</dd>
    </dl>
  </section>

  <section class="block">
    <span class="label">KEYBOARD</span>
    <dl class="rows">
      <dt><kbd>Space</kbd></dt>
      <dd>Play / pause</dd>
      <dt><kbd>←</kbd> / <kbd>→</kbd></dt>
      <dd>Previous / next track</dd>
      <dt><kbd>↑</kbd></dt>
      <dd>Open TV Guide</dd>
      <dt><kbd>↓</kbd> / <kbd>I</kbd></dt>
      <dd>Show song info</dd>
      <dt><kbd>Q</kbd></dt>
      <dd>Open Queue</dd>
      <dt><kbd>/</kbd></dt>
      <dd>Open Search</dd>
      <dt><kbd>M</kbd></dt>
      <dd>Toggle mute</dd>
      <dt><kbd>F</kbd></dt>
      <dd>Toggle fullscreen</dd>
      <dt><kbd>S</kbd></dt>
      <dd>Toggle ★ favourite</dd>
      <dt><kbd>D</kbd></dt>
      <dd>Dev review mode</dd>
      <dt><kbd>Esc</kbd></dt>
      <dd>Close any open panel</dd>
    </dl>
  </section>

  <p class="legal">
    Music videos stream from YouTube and remain &copy; their respective owners, subject to the
    YouTube Terms of Service.
  </p>
</Sheet>

<style>
  .block {
    margin-bottom: 24px;
  }
  .label {
    display: block;
    font-family: 'VT323', monospace;
    font-size: 20px;
    letter-spacing: 3px;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 12px;
  }
  .rows {
    display: grid;
    grid-template-columns: minmax(120px, 0.4fr) 1fr;
    column-gap: 18px;
    row-gap: 8px;
    margin: 0;
  }
  dt {
    font-family: 'VT323', monospace;
    font-size: 17px;
    letter-spacing: 2px;
    color: var(--accent-2);
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
  }
  dd {
    margin: 0;
    font-family: 'Archivo', sans-serif;
    font-size: 15px;
    color: rgba(255, 255, 255, 0.85);
  }
  kbd {
    display: inline-block;
    font-family: 'VT323', monospace;
    font-size: 15px;
    line-height: 1;
    padding: 3px 7px;
    background: rgba(255, 255, 255, 0.06);
    border: 1.5px solid rgba(255, 255, 255, 0.25);
    box-shadow: 2px 2px 0 var(--accent-2);
    color: #fff;
    min-width: 22px;
    text-align: center;
  }
  .legal {
    font-family: 'VT323', monospace;
    font-size: 14px;
    letter-spacing: 1px;
    color: rgba(255, 255, 255, 0.35);
    margin: 28px 0 0;
    padding-top: 14px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    text-align: center;
  }
</style>

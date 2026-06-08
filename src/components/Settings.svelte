<script>
  import { settingsOpen, crtOn, hintsOn, logoOn, progressOn } from '../lib/stores.js';
  import Sheet from './Sheet.svelte';
  import Toggle from './Toggle.svelte';
</script>

<Sheet
  open={$settingsOpen}
  label="Display settings"
  accent="var(--accent-2)"
  on:close={() => settingsOpen.set(false)}
>
  <svelte:fragment slot="title">
    <span class="sheet-wordmark" aria-hidden="true">
      <span class="sheet-wm-1">VIDEO KILLED</span>
      <span class="sheet-wm-2">THE RADIO STAR</span>
    </span>
    <span class="sheet-subheading">SETTINGS</span>
  </svelte:fragment>

  <p class="intro">Display options for the channel. Changes apply instantly.</p>

  <Toggle label="CRT TUBE FILTER" checked={$crtOn} on:toggle={() => crtOn.update((v) => !v)} />
  <Toggle
    label="SONG INFO"
    hint="(off = guess mode)"
    checked={$hintsOn}
    on:toggle={() => hintsOn.update((v) => !v)}
  />
  <Toggle label="STATION LOGO" checked={$logoOn} on:toggle={() => logoOn.update((v) => !v)} />
  <Toggle
    label="PROGRESS BAR"
    hint="(bottom edge)"
    checked={$progressOn}
    on:toggle={() => progressOn.update((v) => !v)}
  />

  <button class="done" type="button" on:click={() => settingsOpen.set(false)}>&#x2713;&nbsp; DONE</button>
</Sheet>

<style>
  .intro {
    font-family: 'VT323', monospace;
    font-size: 17px;
    letter-spacing: 1px;
    color: rgba(255, 255, 255, 0.55);
    margin: -6px 0 22px;
  }
  .done {
    width: 100%;
    font-family: 'Anton', sans-serif;
    font-size: clamp(18px, 3vw, 24px);
    letter-spacing: 3px;
    color: #050505;
    background: var(--accent-2);
    border: 3px solid #050505;
    padding: 14px;
    cursor: pointer;
    margin-top: 18px;
    box-shadow: 5px 5px 0 #050505;
    transition:
      transform 0.1s ease,
      box-shadow 0.1s ease;
  }
  .done:hover {
    box-shadow: 8px 8px 0 #050505;
    transform: translate(-2px, -2px);
  }
  .done:active {
    transform: translate(3px, 3px);
    box-shadow: 0 0 0 #050505;
  }
</style>

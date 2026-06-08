<script>
  import { get } from 'svelte/store';
  import { queueOpen, playlist, index, currentVideo } from '../lib/stores.js';
  import { loadQueue, resetErrors } from '../lib/player.js';
  import Sheet from './Sheet.svelte';

  let items = [];
  let lastOpen = false;

  // snapshot the live queue each time the panel opens
  $: if ($queueOpen !== lastOpen) {
    if ($queueOpen) items = [...$playlist];
    lastOpen = $queueOpen;
  }

  $: nowId = $currentVideo ? $currentVideo.video_id : null;

  function moveUp(i) {
    if (i <= 0) return;
    [items[i - 1], items[i]] = [items[i], items[i - 1]];
    items = [...items];
  }
  function moveDown(i) {
    if (i >= items.length - 1) return;
    [items[i + 1], items[i]] = [items[i], items[i + 1]];
    items = [...items];
  }
  function remove(i) {
    if (items.length <= 1) return; // keep at least one track
    items = items.filter((_, idx) => idx !== i);
  }

  function apply() {
    if (!items.length) return;
    const curId = get(currentVideo)?.video_id;
    const newIndex = items.findIndex((t) => t.video_id === curId);
    const keepCurrent = newIndex >= 0;
    playlist.set(items);
    index.set(keepCurrent ? newIndex : 0);
    resetErrors();
    queueOpen.set(false);
    loadQueue(keepCurrent ? newIndex : 0, keepCurrent);
  }
</script>

<Sheet
  open={$queueOpen}
  label="Queue — reorder and remove songs"
  accent="var(--accent-2)"
  on:close={() => queueOpen.set(false)}
>
  <svelte:fragment slot="title">
    <span class="sheet-wordmark" aria-hidden="true">
      <span class="sheet-wm-1">VIDEO KILLED</span>
      <span class="sheet-wm-2">THE RADIO STAR</span>
    </span>
    <span class="sheet-subheading">QUEUE <small class="count">{items.length} tracks</small></span>
  </svelte:fragment>

  <ol class="rows">
    {#each items as t, i (t.video_id)}
      <li class="row" class:now={t.video_id === nowId}>
        <span class="pos">{t.video_id === nowId ? '▶' : i + 1}</span>
        <span class="meta">
          <span class="artist">{t.artist}</span>
          <span class="title">{t.title} · {t.year}</span>
        </span>
        <span class="ctrls">
          <button type="button" aria-label="Move up" disabled={i === 0} on:click={() => moveUp(i)}
            >▲</button
          >
          <button
            type="button"
            aria-label="Move down"
            disabled={i === items.length - 1}
            on:click={() => moveDown(i)}>▼</button
          >
          <button
            type="button"
            class="rm"
            aria-label="Remove"
            disabled={items.length <= 1}
            on:click={() => remove(i)}>✕</button
          >
        </span>
      </li>
    {/each}
  </ol>

  <button class="apply" type="button" on:click={apply}>&#x25B6;&nbsp; APPLY QUEUE</button>
  <p class="note">Reordering/removing here is a one-off edit of the current queue (not saved).</p>
</Sheet>

<style>
  /* slotted title count (styled in this component's scope) */
  .count {
    font-family: 'VT323', monospace;
    font-size: 18px;
    color: rgba(255, 255, 255, 0.4);
    letter-spacing: 1px;
  }

  .rows {
    list-style: none;
    margin: 0 0 18px;
    padding: 0;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 6px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  .row.now {
    background: rgba(255, 46, 99, 0.12);
  }
  .pos {
    flex: 0 0 28px;
    text-align: center;
    font-family: 'VT323', monospace;
    font-size: 20px;
    color: rgba(255, 255, 255, 0.45);
  }
  .row.now .pos {
    color: var(--accent);
  }
  .meta {
    flex: 1 1 auto;
    min-width: 0;
  }
  .meta .artist {
    display: block;
    font-family: 'Archivo', sans-serif;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .meta .title {
    display: block;
    font-family: 'VT323', monospace;
    font-size: 17px;
    letter-spacing: 1px;
    color: rgba(255, 255, 255, 0.5);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ctrls {
    flex: 0 0 auto;
    display: flex;
    gap: 6px;
  }
  .ctrls button {
    width: 38px;
    height: 38px;
    font-size: 15px;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.25);
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
  }
  .ctrls button:disabled {
    opacity: 0.25;
    cursor: default;
  }
  .ctrls button:not(:disabled):hover {
    border-color: var(--accent-2);
    color: var(--accent-2);
  }
  .ctrls .rm:not(:disabled):hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  .apply {
    width: 100%;
    font-family: 'Anton', sans-serif;
    font-size: clamp(20px, 3.4vw, 28px);
    letter-spacing: 3px;
    color: #050505;
    background: var(--bug-yellow);
    border: none;
    padding: 16px;
    cursor: pointer;
  }
  .apply:active {
    transform: scale(0.99);
  }
  .note {
    font-family: 'VT323', monospace;
    font-size: 15px;
    letter-spacing: 1px;
    color: rgba(255, 255, 255, 0.35);
    text-align: center;
    margin: 12px 0 0;
  }
</style>

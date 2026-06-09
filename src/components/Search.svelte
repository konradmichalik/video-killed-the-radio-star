<script>
  import { videos, playlist, index, searchOpen } from '../lib/stores.js';
  import { searchVideos, shuffle } from '../lib/data.js';
  import { loadQueue, resetErrors } from '../lib/player.js';
  import Sheet from './Sheet.svelte';

  let query = '';
  let highlight = 0;
  let lastOpen = false;

  // reset the field each time the panel opens
  $: if ($searchOpen !== lastOpen) {
    if ($searchOpen) {
      query = '';
      highlight = 0;
    }
    lastOpen = $searchOpen;
  }

  // Count all matches separately from the displayed top-N so the user can see
  // refinement happening even when the visible list is already at the cap.
  $: results = searchVideos($videos, query);
  $: totalMatches = query.trim() ? searchVideos($videos, query, Infinity).length : 0;
  $: if (highlight > results.length - 1) highlight = results.length ? results.length - 1 : 0;

  function play(v) {
    if (!v) return;
    const rest = shuffle($videos.filter((x) => x.video_id !== v.video_id));
    playlist.set([v, ...rest]);
    index.set(0);
    resetErrors();
    searchOpen.set(false);
    query = '';
    loadQueue(0); // play the picked track now, channel continues after
  }

  function onKeydown(e) {
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlight = Math.min(highlight + 1, results.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlight = Math.max(highlight - 1, 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      play(results[highlight]);
    }
  }
</script>

<Sheet
  open={$searchOpen}
  label="Search tracks"
  accent="var(--bug-yellow)"
  on:close={() => searchOpen.set(false)}
>
  <svelte:fragment slot="title">
    <span class="sheet-wordmark" aria-hidden="true">
      <span class="sheet-wm-1">VIDEO KILLED</span>
      <span class="sheet-wm-2">THE RADIO STAR</span>
    </span>
    <span class="sheet-subheading">SEARCH</span>
  </svelte:fragment>
  <div class="field">
    <span class="prompt">&gt;</span>
    <input
      type="text"
      data-autofocus
      aria-label="Search tracks"
      bind:value={query}
      on:input={() => (highlight = 0)}
      on:keydown={onKeydown}
      placeholder="artist, title, year, country…"
      role="combobox"
      aria-expanded={results.length > 0}
      aria-controls="search-results"
      aria-autocomplete="list"
      aria-activedescendant={results.length ? `search-opt-${highlight}` : undefined}
      autocomplete="off"
      autocapitalize="off"
      autocorrect="off"
      spellcheck="false"
    />
  </div>

  {#if totalMatches > 0}
    <p class="match-count" aria-live="polite">
      {totalMatches} match{totalMatches === 1 ? '' : 'es'}{totalMatches > results.length
        ? ` · showing top ${results.length}`
        : ''}
    </p>
  {/if}

  <ul class="results" id="search-results" role="listbox" aria-label="Matching tracks">
    {#each results as v, i (v.video_id)}
      <li>
        <button
          type="button"
          id="search-opt-{i}"
          class="result"
          class:active={i === highlight}
          role="option"
          aria-selected={i === highlight}
          on:mouseenter={() => (highlight = i)}
          on:click={() => play(v)}
        >
          <span class="r-meta">
            <span class="r-artist">{v.artist}</span>
            <span class="r-title">{v.title}</span>
          </span>
          <span class="r-tags"
            >{v.year}{#if v.country}
              · {v.country}{/if}</span
          >
        </button>
      </li>
    {/each}
  </ul>

  {#if query.trim() && !results.length}
    <p class="empty">// NO MATCHES</p>
  {:else if !query.trim()}
    <p class="empty">// type to find a track — Enter to play</p>
  {/if}
</Sheet>

<style>
  .field {
    display: flex;
    align-items: center;
    gap: 12px;
    border: 2px solid var(--bug-yellow);
    background: rgba(0, 0, 0, 0.4);
    padding: 12px 16px;
    margin-bottom: 18px;
  }
  .prompt {
    font-family: 'VT323', monospace;
    font-size: 26px;
    color: var(--bug-yellow);
    line-height: 1;
  }
  .field input {
    flex: 1 1 auto;
    min-width: 0;
    background: none;
    border: none;
    color: #fff;
    font-family: 'VT323', monospace;
    font-size: clamp(20px, 3vw, 26px);
    letter-spacing: 1px;
  }
  .field input:focus {
    outline: none;
  }
  .field input::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  .results {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 52vh;
    overflow-y: auto;
  }
  .result {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    width: 100%;
    text-align: left;
    background: transparent;
    border: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding: 11px 8px;
    cursor: pointer;
    color: #fff;
  }
  .result.active {
    background: rgba(255, 209, 0, 0.14);
  }
  .r-meta {
    min-width: 0;
  }
  .r-artist {
    display: block;
    font-family: 'Archivo', sans-serif;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .r-title {
    display: block;
    font-family: 'VT323', monospace;
    font-size: 17px;
    letter-spacing: 1px;
    color: rgba(255, 255, 255, 0.55);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .r-tags {
    flex: 0 0 auto;
    font-family: 'VT323', monospace;
    font-size: 15px;
    letter-spacing: 1px;
    color: rgba(255, 255, 255, 0.4);
    white-space: nowrap;
  }
  .match-count {
    font-family: 'VT323', monospace;
    font-size: 15px;
    letter-spacing: 2px;
    color: var(--bug-yellow);
    margin: 0 0 10px;
    text-align: right;
  }
  .empty {
    font-family: 'VT323', monospace;
    font-size: 17px;
    letter-spacing: 2px;
    color: rgba(255, 255, 255, 0.4);
    text-align: center;
    margin: 18px 0 4px;
  }
</style>

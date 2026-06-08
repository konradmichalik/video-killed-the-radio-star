<script>
  import {
    videos,
    playlist,
    index,
    guideOpen,
    queueOpen,
    searchOpen,
    settingsOpen,
    helpHint,
  } from '../lib/stores.js';
  import {
    genresOf,
    countriesOf,
    yearBounds,
    filterVideos,
    shuffle,
    groupCountriesByContinent,
  } from '../lib/data.js';
  import { loadQueue, resetErrors } from '../lib/player.js';
  import { loadFilters, saveFilters } from '../lib/channel.js';
  import { buildPresets } from '../lib/presets.js';
  import { slide } from 'svelte/transition';
  import Sheet from './Sheet.svelte';

  // Each filter section starts collapsed and shows a teaser; click expands.
  let openSections = { channels: false, year: false, genres: false, origin: false };
  function toggleSection(key) {
    openSections = { ...openSections, [key]: !openSections[key] };
  }

  let boundsLo = 1980,
    boundsHi = 2020;
  let yearLo = boundsLo,
    yearHi = boundsHi;
  let genres = [];
  let selected = {}; // { [genre]: boolean }
  let countries = [];
  let selCountry = {}; // { [country]: boolean }
  let foot = '';
  let initd = false;

  // initialise once videos are loaded — restoring the last saved channel if any
  $: if ($videos.length && !initd) {
    [boundsLo, boundsHi] = yearBounds($videos);
    genres = genresOf($videos);
    countries = countriesOf($videos);
    const saved = loadFilters();
    if (saved) {
      yearLo = Math.min(Math.max(saved.yearMin ?? boundsLo, boundsLo), boundsHi);
      yearHi = Math.min(Math.max(saved.yearMax ?? boundsHi, boundsLo), boundsHi);
      if (yearLo > yearHi) {
        yearLo = boundsLo;
        yearHi = boundsHi;
      }
      const savedGenres = new Set(saved.genres ?? genres);
      selected = Object.fromEntries(genres.map((g) => [g, savedGenres.has(g)]));
      if (!genres.some((g) => selected[g])) {
        selected = Object.fromEntries(genres.map((g) => [g, true]));
      }
      const savedCountries = new Set(saved.countries ?? countries);
      selCountry = Object.fromEntries(countries.map((c) => [c, savedCountries.has(c)]));
      if (!countries.some((c) => selCountry[c])) {
        selCountry = Object.fromEntries(countries.map((c) => [c, true]));
      }
    } else {
      yearLo = boundsLo;
      yearHi = boundsHi;
      selected = Object.fromEntries(genres.map((g) => [g, true]));
      selCountry = Object.fromEntries(countries.map((c) => [c, true]));
    }
    initd = true;
  }

  // keep the two thumbs from crossing
  function clampMin() {
    if (yearLo > yearHi) yearLo = yearHi;
  }
  function clampMax() {
    if (yearHi < yearLo) yearHi = yearLo;
  }

  $: span = boundsHi - boundsLo || 1;
  $: fillLeft = ((yearLo - boundsLo) / span) * 100;
  $: fillRight = 100 - ((yearHi - boundsLo) / span) * 100;

  function toggleGenre(g) {
    selected = { ...selected, [g]: !selected[g] };
  }

  function toggleCountry(c) {
    selCountry = { ...selCountry, [c]: !selCountry[c] };
  }

  // one-tap channel presets, generated from the data
  $: presets = buildPresets($videos);
  $: selectedGenreCount = genres.filter((g) => selected[g]).length;
  $: selectedCountryCount = countries.filter((c) => selCountry[c]).length;
  $: continentGroups = groupCountriesByContinent(countries);

  function applyPreset(p) {
    yearLo = Math.min(Math.max(p.yearMin, boundsLo), boundsHi);
    yearHi = Math.min(Math.max(p.yearMax, boundsLo), boundsHi);
    const wantG = p.genres ? new Set(p.genres) : new Set(genres);
    selected = Object.fromEntries(genres.map((g) => [g, wantG.has(g)]));
    const wantC = p.countries ? new Set(p.countries) : new Set(countries);
    selCountry = Object.fromEntries(countries.map((c) => [c, wantC.has(c)]));
    apply(); // reflect in the UI, save, build queue and play immediately
  }

  function apply() {
    const chosenG = new Set(genres.filter((g) => selected[g]));
    const chosenC = countries.filter((c) => selCountry[c]);
    // only constrain by country when a strict subset is picked
    const countryFilter =
      chosenC.length && chosenC.length < countries.length ? new Set(chosenC) : null;
    const filtered = filterVideos($videos, {
      yearMin: yearLo,
      yearMax: yearHi,
      genres: chosenG,
      countries: countryFilter,
    });
    if (!filtered.length) {
      foot = '// NO SIGNAL — adjust your filters';
      return;
    }
    foot = '';
    saveFilters({
      yearMin: yearLo,
      yearMax: yearHi,
      genres: genres.filter((g) => selected[g]),
      countries: chosenC,
    });
    playlist.set(shuffle(filtered));
    index.set(0);
    resetErrors();
    guideOpen.set(false);
    loadQueue(0);
  }

  function openQueue() {
    guideOpen.set(false);
    queueOpen.set(true);
  }

  function openSearch() {
    guideOpen.set(false);
    searchOpen.set(true);
  }

  function showHelp() {
    guideOpen.set(false);
    helpHint.update((n) => n + 1);
  }

  function openSettings() {
    guideOpen.set(false);
    settingsOpen.set(true);
  }
</script>

<Sheet
  open={$guideOpen}
  label="TV Guide — filters and presets"
  accent="var(--accent)"
  on:close={() => guideOpen.set(false)}
>
  <svelte:fragment slot="title">
    <span class="sheet-wordmark" aria-hidden="true">
      <span class="sheet-wm-1">VIDEO KILLED</span>
      <span class="sheet-wm-2">THE RADIO STAR</span>
    </span>
    <span class="sheet-subheading">TV GUIDE</span>
  </svelte:fragment>

  <svelte:fragment slot="actions">
    <button class="icon-btn" type="button" aria-label="Show controls help" on:click={showHelp}
      >?</button
    >
    <button class="icon-btn" type="button" aria-label="Display settings" on:click={openSettings}>
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <line x1="4" y1="21" x2="4" y2="14" />
        <line x1="4" y1="10" x2="4" y2="3" />
        <line x1="12" y1="21" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12" y2="3" />
        <line x1="20" y1="21" x2="20" y2="16" />
        <line x1="20" y1="12" x2="20" y2="3" />
        <line x1="1" y1="14" x2="7" y2="14" />
        <line x1="9" y1="8" x2="15" y2="8" />
        <line x1="17" y1="16" x2="23" y2="16" />
      </svg>
    </button>
    <button class="icon-btn" type="button" aria-label="Search tracks" on:click={openSearch}>
      <svg
        viewBox="0 0 16 16"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <circle cx="7" cy="7" r="4.5" />
        <line x1="10.4" y1="10.4" x2="14.5" y2="14.5" />
      </svg>
    </button>
    <button class="icon-btn" type="button" aria-label="View queue" on:click={openQueue}>
      <svg
        viewBox="0 0 16 16"
        width="18"
        height="18"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <line x1="2" y1="4" x2="14" y2="4" />
        <line x1="2" y1="8" x2="14" y2="8" />
        <line x1="2" y1="12" x2="14" y2="12" />
      </svg>
    </button>
  </svelte:fragment>

  <section class="block">
    <button
      type="button"
      class="block-header"
      aria-expanded={openSections.channels}
      on:click={() => toggleSection('channels')}
    >
      <span class="label">CHANNELS</span>
      <span class="block-preview">
        {presets.length} preset{presets.length === 1 ? '' : 's'}
        <span class="chev" class:open={openSections.channels}>▾</span>
      </span>
    </button>
    {#if openSections.channels}
      <div class="block-body" transition:slide={{ duration: 220 }}>
        <div class="preset-list">
          {#each presets as p}
            <button type="button" class="preset-chip" on:click={() => applyPreset(p)}
              >{p.label}</button
            >
          {/each}
        </div>
      </div>
    {/if}
  </section>

  <section class="block">
    <button
      type="button"
      class="block-header"
      aria-expanded={openSections.year}
      on:click={() => toggleSection('year')}
    >
      <span class="label">YEAR RANGE</span>
      <span class="block-preview">
        <span class="preview-value">{yearLo} — {yearHi}</span>
        <span class="chev" class:open={openSections.year}>▾</span>
      </span>
    </button>
    {#if openSections.year}
      <div class="block-body" transition:slide={{ duration: 220 }}>
        <div class="range-wrap">
          <div class="range-track">
            <div class="range-fill" style="left:{fillLeft}%; right:{fillRight}%"></div>
          </div>
          <input
            type="range"
            min={boundsLo}
            max={boundsHi}
            bind:value={yearLo}
            on:input={clampMin}
          />
          <input
            type="range"
            min={boundsLo}
            max={boundsHi}
            bind:value={yearHi}
            on:input={clampMax}
          />
        </div>
      </div>
    {/if}
  </section>

  <section class="block">
    <button
      type="button"
      class="block-header"
      aria-expanded={openSections.genres}
      on:click={() => toggleSection('genres')}
    >
      <span class="label">GENRES</span>
      <span class="block-preview">
        {selectedGenreCount} of {genres.length} selected
        <span class="chev" class:open={openSections.genres}>▾</span>
      </span>
    </button>
    {#if openSections.genres}
      <div class="block-body" transition:slide={{ duration: 220 }}>
        <div class="genre-list">
          {#each genres as g}
            <button
              type="button"
              class="chip"
              class:on={selected[g]}
              aria-pressed={selected[g]}
              on:click={() => toggleGenre(g)}>{g}</button
            >
          {/each}
        </div>
      </div>
    {/if}
  </section>

  {#if countries.length}
    <section class="block">
      <button
        type="button"
        class="block-header"
        aria-expanded={openSections.origin}
        on:click={() => toggleSection('origin')}
      >
        <span class="label">ORIGIN</span>
        <span class="block-preview">
          {selectedCountryCount} of {countries.length} selected
          <span class="chev" class:open={openSections.origin}>▾</span>
        </span>
      </button>
      {#if openSections.origin}
        <div class="block-body" transition:slide={{ duration: 220 }}>
          {#each continentGroups as g (g.continent)}
            <div class="continent-group">
              <span class="continent-label">{g.label}</span>
              <div class="genre-list">
                {#each g.countries as c}
                  <button
                    type="button"
                    class="chip"
                    class:on={selCountry[c]}
                    aria-pressed={selCountry[c]}
                    on:click={() => toggleCountry(c)}>{c}</button
                  >
                {/each}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  {/if}

  <button class="apply" type="button" on:click={apply}>&#x25B6;&nbsp; PLAY CHANNEL</button>
  {#if foot}<p class="foot">{foot}</p>{/if}

  <div class="howto">
    <p>
      <b>TOUCH</b> &nbsp;tap center = play/pause · tap edges = skip · swipe ◀▶ = change · swipe ▲ = guide
      · swipe ▼ = song info
    </p>
    <p>
      <b>KEYS</b> &nbsp;Space = play/pause · ← → = skip · ↑ = guide · / = search · I = reveal · M = mute
      · F = fullscreen
    </p>
    <p class="legal">
      A nostalgic music-video channel. Videos are streamed via YouTube and remain &copy; their
      respective owners; use is subject to YouTube's Terms of Service.
    </p>
  </div>
</Sheet>

<style>
  .block {
    margin-bottom: 18px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }
  .block:first-of-type {
    border-top: none;
  }
  .block-header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    background: transparent;
    border: none;
    padding: 14px 0 12px;
    color: inherit;
    cursor: pointer;
    text-align: left;
    transition: color 0.12s ease;
  }
  .block-header:hover .label,
  .block-header:hover .block-preview {
    color: #fff;
  }
  .label {
    font-family: 'VT323', monospace;
    font-size: 20px;
    letter-spacing: 3px;
    color: rgba(255, 255, 255, 0.7);
  }
  .block-preview {
    font-family: 'VT323', monospace;
    font-size: 16px;
    letter-spacing: 2px;
    color: rgba(255, 255, 255, 0.45);
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }
  .preview-value {
    color: var(--bug-yellow);
  }
  .chev {
    font-size: 12px;
    transition: transform 0.18s ease;
  }
  .chev.open {
    transform: rotate(180deg);
  }
  .block-body {
    padding-bottom: 18px;
  }

  .preset-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .preset-chip {
    font-family: 'Anton', sans-serif;
    font-size: clamp(15px, 2vw, 19px);
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 10px 18px;
    background: transparent;
    color: #fff;
    border: 2px solid var(--accent-2);
    cursor: pointer;
    transition:
      transform 0.08s,
      box-shadow 0.08s;
  }
  .preset-chip:hover {
    box-shadow: 4px 4px 0 var(--accent-2);
    transform: translate(-1px, -1px);
  }
  .preset-chip:active {
    transform: translate(2px, 2px);
    box-shadow: none;
  }

  .range-wrap {
    position: relative;
    height: 38px;
  }
  .range-track {
    position: absolute;
    top: 16px;
    left: 0;
    right: 0;
    height: 6px;
    background: rgba(255, 255, 255, 0.15);
  }
  .range-fill {
    position: absolute;
    top: 0;
    bottom: 0;
    background: var(--accent);
  }
  .range-wrap input[type='range'] {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 38px;
    margin: 0;
    background: none;
    pointer-events: none;
    -webkit-appearance: none;
    appearance: none;
  }
  .range-wrap input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    pointer-events: auto;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--bug-yellow);
    border: 3px solid #000;
    cursor: pointer;
    margin-top: -1px;
    transition:
      transform 0.1s ease,
      box-shadow 0.1s ease;
  }
  .range-wrap input[type='range']::-webkit-slider-thumb:hover {
    transform: scale(1.15);
    box-shadow: 0 0 0 4px rgba(255, 230, 0, 0.25);
  }
  .range-wrap input[type='range']::-moz-range-thumb {
    pointer-events: auto;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--bug-yellow);
    border: 3px solid #000;
    cursor: pointer;
    transition:
      transform 0.1s ease,
      box-shadow 0.1s ease;
  }
  .range-wrap input[type='range']::-moz-range-thumb:hover {
    transform: scale(1.15);
    box-shadow: 0 0 0 4px rgba(255, 230, 0, 0.25);
  }

  .genre-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
  .continent-group {
    margin-bottom: 16px;
  }
  .continent-group:last-child {
    margin-bottom: 0;
  }
  .continent-label {
    display: block;
    font-family: 'VT323', monospace;
    font-size: 14px;
    letter-spacing: 3px;
    color: rgba(255, 255, 255, 0.4);
    margin-bottom: 8px;
  }
  .chip {
    font-family: 'Archivo', sans-serif;
    font-weight: 700;
    font-size: clamp(14px, 2vw, 18px);
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 12px 22px;
    background: transparent;
    color: rgba(255, 255, 255, 0.7);
    border: 2px solid rgba(255, 255, 255, 0.25);
    cursor: pointer;
    transition:
      transform 0.1s ease,
      box-shadow 0.1s ease,
      border-color 0.12s ease,
      color 0.12s ease,
      background 0.12s ease;
  }
  .chip:hover {
    color: #fff;
    border-color: var(--accent-2);
    box-shadow: 4px 4px 0 var(--accent-2);
    transform: translate(-2px, -2px);
  }
  .chip:active {
    transform: translate(2px, 2px);
    box-shadow: none;
  }
  .chip.on {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);
    box-shadow: 4px 4px 0 var(--accent-2);
  }
  .chip.on:hover {
    box-shadow: 6px 6px 0 var(--accent-2);
    transform: translate(-2px, -2px);
  }

  .apply {
    width: 100%;
    font-family: 'Anton', sans-serif;
    font-size: clamp(20px, 3.4vw, 28px);
    letter-spacing: 3px;
    color: #050505;
    background: var(--bug-yellow);
    border: 3px solid #050505;
    padding: 16px;
    cursor: pointer;
    margin-top: 6px;
    box-shadow: 5px 5px 0 #050505;
    transition:
      transform 0.1s ease,
      box-shadow 0.1s ease;
  }
  .apply:hover {
    box-shadow: 8px 8px 0 #050505;
    transform: translate(-2px, -2px);
  }
  .apply:active {
    transform: translate(3px, 3px);
    box-shadow: 0 0 0 #050505;
  }
  .foot {
    font-family: 'VT323', monospace;
    font-size: 17px;
    letter-spacing: 2px;
    color: rgba(255, 255, 255, 0.5);
    text-align: center;
    margin: 14px 0 0;
  }
  .howto {
    margin-top: 22px;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
  }
  .howto p {
    font-family: 'VT323', monospace;
    font-size: 16px;
    letter-spacing: 1px;
    color: rgba(255, 255, 255, 0.5);
    margin: 0 0 8px;
  }
  .howto b {
    color: var(--accent-2);
  }
  .howto .legal {
    color: rgba(255, 255, 255, 0.32);
    font-size: 14px;
    margin-top: 12px;
  }
</style>

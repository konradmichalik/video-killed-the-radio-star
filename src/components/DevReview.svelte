<script>
  import {
    devMode,
    currentVideo,
    videos,
    videoReviews,
    updateReview,
    skipReviewedOk,
  } from '../lib/stores.js';
  import { seekBy } from '../lib/player.js';

  // Live progress across the whole catalog.
  $: stats = (() => {
    let ok = 0;
    let issue = 0;
    for (const r of Object.values($videoReviews)) {
      if (!r.status) continue;
      if (r.status === 'OK') ok++;
      else issue++;
    }
    const total = $videos.length;
    const reviewed = ok + issue;
    return {
      ok,
      issue,
      todo: Math.max(0, total - reviewed),
      total,
      pct: total ? Math.round((reviewed / total) * 100) : 0,
    };
  })();

  const STATUSES = [
    { value: 'OK', label: 'OK', title: 'real music video — fits the channel' },
    { value: 'LYRIC', label: 'LYRIC', title: 'lyric / visualizer video, not the original' },
    { value: 'LIVE', label: 'LIVE', title: 'live recording instead of studio music video' },
    {
      value: 'AUDIO',
      label: 'AUDIO',
      title: 'audio + still image / album cover, no motion',
    },
    { value: 'FAN', label: 'FAN', title: 'fan upload / re-cut / edit' },
    { value: 'WRONG', label: 'WRONG', title: 'wrong song or artist — replacement ID needed' },
    { value: 'DROP', label: 'DROP', title: 'drop — does not fit the MTV channel vibe' },
  ];

  $: selectedStatus = STATUSES.find((s) => s.value === review.status);

  $: id = $currentVideo?.video_id;
  $: review = (id && $videoReviews[id]) || {};

  function setField(key, value) {
    if (!id) return;
    updateReview(id, { [key]: value });
  }
</script>

{#if $devMode && $currentVideo}
  <aside class="dev-review" aria-label="Video review (dev mode)">
    <header>
      <span class="badge">DEV REVIEW</span>
      <button
        type="button"
        class="close"
        aria-label="Close dev mode"
        on:click={() => devMode.set(false)}>✕</button
      >
    </header>

    <div class="stats" title="OK reviewed · issues found · not yet checked / total catalog">
      <span class="stat ok">✓ {stats.ok}</span>
      <span class="stat issue">✗ {stats.issue}</span>
      <span class="stat todo">? {stats.todo}</span>
      <span class="pct">{stats.pct}%</span>
      <span class="progress" aria-hidden="true">
        <span class="progress-fill" style="width: {stats.pct}%"></span>
      </span>
    </div>

    <div class="meta">
      <div class="title">{$currentVideo.artist} — {$currentVideo.title}</div>
      <div class="sub">
        {$currentVideo.year} · {$currentVideo.genre}{$currentVideo.country
          ? ` · ${$currentVideo.country}`
          : ''}
        · <code>{id}</code>
      </div>
    </div>

    <div class="seek-row">
      <button type="button" class="seek-btn" on:click={() => seekBy(10)} title="Skip ahead 10 s"
        >+10s</button
      >
      <button type="button" class="seek-btn" on:click={() => seekBy(30)} title="Skip ahead 30 s"
        >+30s</button
      >
    </div>

    <label
      class="auto-skip"
      title="Auto-skip every track that already has a status — only un-checked tracks play (dev mode only)"
    >
      <input
        type="checkbox"
        checked={$skipReviewedOk}
        on:change={(e) => skipReviewedOk.set(e.currentTarget.checked)}
      />
      play un-reviewed only
    </label>

    <fieldset>
      <legend>Video spoilers</legend>
      <label
        ><input
          type="checkbox"
          checked={!!review.spoilerTitle}
          on:change={(e) => setField('spoilerTitle', e.currentTarget.checked)}
        /> shows title/artist</label
      >
      <label
        ><input
          type="checkbox"
          checked={!!review.spoilerYear}
          on:change={(e) => setField('spoilerYear', e.currentTarget.checked)}
        /> shows year</label
      >
    </fieldset>

    <fieldset>
      <legend>Status</legend>
      <div class="chips">
        {#each STATUSES as s}
          <button
            type="button"
            class="chip"
            class:on={review.status === s.value}
            class:drop={s.value === 'DROP'}
            title={s.title}
            on:click={() => setField('status', review.status === s.value ? null : s.value)}
            >{s.label}</button
          >
        {/each}
      </div>
      <p class="status-help">
        {#if selectedStatus}
          <span class="status-help-mark">▸ {selectedStatus.label}</span> — {selectedStatus.title}
        {:else}
          Hover/tap a chip for the description. AUDIO = static cover, no motion. DROP = remove
          entirely.
        {/if}
      </p>
    </fieldset>

    <label class="field">
      <span>Replacement ID</span>
      <input
        type="text"
        spellcheck="false"
        autocomplete="off"
        placeholder="e.g. dQw4w9WgXcQ"
        maxlength="11"
        value={review.replacementId ?? ''}
        on:input={(e) => setField('replacementId', e.currentTarget.value.trim() || null)}
      />
    </label>

    <label class="field">
      <span>Notes</span>
      <textarea
        rows="2"
        placeholder="Free text…"
        value={review.notes ?? ''}
        on:input={(e) => setField('notes', e.currentTarget.value)}
      ></textarea>
    </label>

    <footer>
      {#if review.reviewedAt}
        <span class="saved">saved {new Date(review.reviewedAt).toLocaleTimeString()}</span>
      {/if}
      <span class="hint">Console: <code>vktrsReviewsMarkdown()</code></span>
    </footer>
  </aside>
{/if}

<style>
  .dev-review {
    position: absolute;
    top: calc(clamp(14px, 3vh, 36px) + env(safe-area-inset-top, 0px));
    left: calc(clamp(14px, 3vw, 36px) + env(safe-area-inset-left, 0px));
    z-index: 15; /* above TouchOverlay (z10) so inputs receive clicks */
    width: min(340px, calc(100vw - 32px));
    background: rgba(8, 8, 12, 0.92);
    backdrop-filter: blur(8px);
    border: 3px solid #fff;
    box-shadow: 5px 5px 0 var(--accent-2);
    color: rgba(255, 255, 255, 0.85);
    font-family: 'Archivo', sans-serif;
    font-size: 13px;
    padding: 10px 12px 12px;
    user-select: text;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .badge {
    font-family: 'VT323', monospace;
    font-size: 16px;
    letter-spacing: 3px;
    color: var(--bug-yellow);
  }
  .close {
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: #fff;
    width: 26px;
    height: 26px;
    cursor: pointer;
    font-size: 14px;
  }
  .close:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
  .stats {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 10px;
    padding: 6px 8px;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.08);
    font-family: 'VT323', monospace;
    font-size: 14px;
    letter-spacing: 1.5px;
  }
  .stat {
    color: rgba(255, 255, 255, 0.55);
  }
  .stat.ok {
    color: var(--accent-2);
  }
  .stat.issue {
    color: var(--accent);
  }
  .stat.todo {
    color: var(--bug-yellow);
  }
  .pct {
    margin-left: auto;
    color: rgba(255, 255, 255, 0.85);
    font-size: 13px;
  }
  .progress {
    position: relative;
    flex: 0 0 56px;
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    overflow: hidden;
  }
  .progress-fill {
    position: absolute;
    inset: 0 auto 0 0;
    background: linear-gradient(
      90deg,
      var(--accent-2) 0%,
      var(--accent-2) 70%,
      var(--bug-yellow) 100%
    );
    transition: width 0.2s ease;
  }
  .meta {
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  }
  .meta .title {
    font-weight: 700;
    line-height: 1.25;
    margin-bottom: 2px;
  }
  .meta .sub {
    font-family: 'VT323', monospace;
    font-size: 13px;
    letter-spacing: 1px;
    color: rgba(255, 255, 255, 0.55);
  }
  .meta code,
  footer code {
    font-family: 'VT323', monospace;
    color: var(--accent-2);
  }
  .seek-row {
    display: flex;
    gap: 6px;
    margin: 0 0 10px;
  }
  .seek-btn {
    flex: 1;
    font-family: 'VT323', monospace;
    font-size: 15px;
    letter-spacing: 2px;
    padding: 5px 0;
    background: transparent;
    color: var(--bug-yellow);
    border: 1.5px solid rgba(255, 230, 0, 0.45);
    cursor: pointer;
    transition:
      transform 0.1s ease,
      box-shadow 0.1s ease,
      border-color 0.12s ease;
  }
  .seek-btn:hover {
    border-color: var(--bug-yellow);
    box-shadow: 3px 3px 0 var(--bug-yellow);
    transform: translate(-1px, -1px);
  }
  .seek-btn:active {
    transform: translate(1px, 1px);
    box-shadow: none;
  }
  .auto-skip {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 10px;
    font-family: 'VT323', monospace;
    font-size: 14px;
    letter-spacing: 1.5px;
    color: rgba(255, 255, 255, 0.65);
    cursor: pointer;
  }
  .auto-skip:hover {
    color: var(--bug-yellow);
  }
  fieldset {
    border: none;
    padding: 0;
    margin: 0 0 10px;
  }
  legend {
    font-family: 'VT323', monospace;
    font-size: 14px;
    letter-spacing: 2px;
    color: rgba(255, 255, 255, 0.55);
    margin-bottom: 4px;
  }
  fieldset label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-right: 14px;
    cursor: pointer;
  }
  input[type='checkbox'] {
    accent-color: var(--accent-2);
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    font-family: 'VT323', monospace;
    font-size: 14px;
    letter-spacing: 1.5px;
    padding: 3px 9px;
    background: transparent;
    color: rgba(255, 255, 255, 0.6);
    border: 1.5px solid rgba(255, 255, 255, 0.25);
    cursor: pointer;
    transition:
      transform 0.1s ease,
      box-shadow 0.1s ease,
      color 0.1s ease,
      border-color 0.1s ease,
      background 0.1s ease;
  }
  .chip:hover {
    color: #fff;
    border-color: var(--accent-2);
    box-shadow: 2px 2px 0 var(--accent-2);
    transform: translate(-1px, -1px);
  }
  .chip.on {
    background: var(--accent-2);
    color: #050505;
    border-color: var(--accent-2);
  }
  /* DROP chip = removal intent → use the danger accent. */
  .chip.drop {
    color: var(--accent);
    border-color: rgba(255, 46, 99, 0.45);
  }
  .chip.drop:hover {
    border-color: var(--accent);
    box-shadow: 2px 2px 0 var(--accent);
  }
  .chip.drop.on {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);
  }
  .status-help {
    font-family: 'VT323', monospace;
    font-size: 12px;
    letter-spacing: 1px;
    color: rgba(255, 255, 255, 0.45);
    margin: 6px 0 0;
    line-height: 1.3;
  }
  .status-help-mark {
    color: var(--bug-yellow);
  }
  .field {
    display: block;
    margin-bottom: 8px;
  }
  .field span {
    display: block;
    font-family: 'VT323', monospace;
    font-size: 14px;
    letter-spacing: 2px;
    color: rgba(255, 255, 255, 0.55);
    margin-bottom: 3px;
  }
  .field input,
  .field textarea {
    width: 100%;
    box-sizing: border-box;
    background: rgba(0, 0, 0, 0.4);
    border: 1.5px solid rgba(255, 255, 255, 0.2);
    color: #fff;
    font-family: 'Archivo', sans-serif;
    font-size: 13px;
    padding: 5px 8px;
    resize: vertical;
  }
  .field input:focus,
  .field textarea:focus {
    outline: 2px solid var(--accent-2);
    outline-offset: 0;
    border-color: var(--accent-2);
  }
  footer {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-family: 'VT323', monospace;
    font-size: 12px;
    letter-spacing: 1px;
    color: rgba(255, 255, 255, 0.4);
    margin-top: 4px;
  }
  .saved {
    color: var(--accent-2);
  }
</style>

<!-- src/components/game/RevealOverlay.svelte -->
<!--
  Full-screen TV overlay shown during the Connected game's "revealed" phase.
  Surfaces the actual year, song info, and every player's guess with distance.
  Mounts above channel content and FloatingControls, below sheets so the host
  can still open the Guide.
-->
<script>
  import { currentVideo, room } from '../../lib/stores.js';
  import { closestYearWinners } from '../../lib/multiplayer/scoring.js';

  $: video = $currentVideo;
  $: actualYear = video?.year ?? null;
  $: submissions = $room.submissions || {};
  $: winners =
    actualYear != null ? new Set(closestYearWinners(submissions, actualYear)) : new Set();
  $: playerName = (id) => $room.players.find((p) => p.id === id)?.name || 'Player';

  $: rows = Object.entries(submissions)
    .map(([id, sub]) => ({
      id,
      name: playerName(id),
      guess: sub.year,
      distance: actualYear != null ? Math.abs(sub.year - actualYear) : null,
      winner: winners.has(id),
    }))
    .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
</script>

<div class="reveal-overlay" role="dialog" aria-modal="false" aria-label="Reveal">
  <div class="content">
    <div class="year-block">
      <span class="year-label">ACTUAL YEAR</span>
      <div class="year-value">{actualYear ?? '????'}</div>
    </div>

    {#if video}
      <div class="song">
        <span class="song-title">{video.title}</span>
        <span class="song-artist">{video.artist}</span>
      </div>
    {/if}

    {#if rows.length > 0}
      <ul class="guesses">
        {#each rows as r (r.id)}
          <li class:winner={r.winner}>
            <span class="g-name">{r.name}</span>
            <span class="g-guess">{r.guess}</span>
            <span class="g-dist">{r.distance === 0 ? 'EXACT' : `±${r.distance ?? '?'}`}</span>
            {#if r.winner}<span class="g-badge">WINNER</span>{/if}
          </li>
        {/each}
      </ul>
    {:else}
      <p class="no-subs">No submissions this round.</p>
    {/if}
  </div>
</div>

<style>
  .reveal-overlay {
    position: fixed;
    inset: 0;
    z-index: 46;
    background: radial-gradient(circle at 50% 35%, rgba(20, 0, 30, 0.92), #050505 75%);
    display: grid;
    place-items: center;
    padding: 24px;
    overflow: auto;
    animation: fade-in 220ms ease-out;
  }
  .content {
    width: min(960px, 100%);
    display: grid;
    gap: 24px;
    text-align: center;
  }
  .year-block {
    display: grid;
    gap: 8px;
  }
  .year-label {
    font-family: 'VT323', monospace;
    font-size: clamp(18px, 2.5vw, 26px);
    letter-spacing: 8px;
    color: rgba(255, 255, 255, 0.55);
    text-transform: uppercase;
  }
  .year-value {
    font-family: 'Anton', sans-serif;
    font-size: clamp(96px, 16vw, 220px);
    letter-spacing: 6px;
    color: var(--bug-yellow);
    line-height: 0.9;
    text-shadow: 6px 6px 0 #050505;
  }
  .song {
    display: grid;
    gap: 4px;
    font-family: 'Anton', sans-serif;
    color: #fff;
    text-transform: uppercase;
  }
  .song-title {
    font-size: clamp(24px, 3.4vw, 38px);
    letter-spacing: 4px;
  }
  .song-artist {
    font-family: 'VT323', monospace;
    font-size: clamp(18px, 2.4vw, 24px);
    letter-spacing: 3px;
    color: var(--accent-2);
  }
  .guesses {
    list-style: none;
    padding: 0;
    margin: 8px 0 0;
    display: grid;
    gap: 8px;
    text-align: left;
  }
  .guesses li {
    display: grid;
    grid-template-columns: 1fr auto auto auto;
    align-items: center;
    gap: 14px;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.06);
    border: 2px solid rgba(255, 255, 255, 0.18);
    font-family: 'VT323', monospace;
    font-size: clamp(16px, 2vw, 20px);
    letter-spacing: 1px;
    color: #fff;
  }
  .g-name {
    text-transform: uppercase;
  }
  .g-guess {
    font-family: 'Anton', sans-serif;
    letter-spacing: 2px;
    color: var(--bug-yellow);
  }
  .g-dist {
    font-family: 'Anton', sans-serif;
    letter-spacing: 2px;
    color: rgba(255, 255, 255, 0.7);
  }
  .g-badge {
    font-family: 'Anton', sans-serif;
    font-size: 14px;
    letter-spacing: 3px;
    color: #050505;
    background: var(--bug-yellow);
    border: 2px solid #050505;
    padding: 2px 8px;
  }
  .winner {
    border-color: var(--bug-yellow);
    box-shadow: 4px 4px 0 var(--bug-yellow);
    animation: winner-pulse 1.4s ease-in-out infinite;
  }
  .no-subs {
    margin: 0;
    font-family: 'VT323', monospace;
    font-size: 20px;
    letter-spacing: 2px;
    color: rgba(255, 255, 255, 0.6);
  }
  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @keyframes winner-pulse {
    0%,
    100% {
      box-shadow: 4px 4px 0 var(--bug-yellow);
    }
    50% {
      box-shadow: 8px 8px 0 var(--bug-yellow);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .reveal-overlay {
      animation: none;
    }
    .winner {
      animation: none;
    }
  }
</style>

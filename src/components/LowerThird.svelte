<script>
  import {
    currentVideo,
    hintsOn,
    revealHint,
    reannounce,
    adPlaying,
    favorites,
  } from '../lib/stores.js';
  import { LOWER_THIRD_MS } from '../lib/constants.js';

  let visible = false;
  let timer;
  let v = null;

  let lastId = null;
  let lastHints = true;
  let lastReveal = 0;
  let lastReann = 0;

  // React to track changes, the info toggle, manual reveals, and the mid-song re-show.
  $: react($currentVideo, $hintsOn, $revealHint, $reannounce, $adPlaying);

  function react(video, hints, reveal, reann, adOn) {
    if (!video) return;
    // While YouTube is playing an ad, never auto-show the lower third —
    // AdIndicator handles the on-screen messaging instead.
    if (adOn) {
      hideNow();
      lastId = video.video_id;
      lastHints = hints;
      lastReveal = reveal;
      lastReann = reann;
      return;
    }
    const trackChanged = video.video_id !== lastId;
    const hintsTurnedOn = hints && !lastHints;
    const revealed = reveal !== lastReveal;
    const reannounced = reann !== lastReann;
    lastId = video.video_id;
    lastHints = hints;
    lastReveal = reveal;
    lastReann = reann;

    if (revealed) {
      showFor(video); // manual reveal (button / swipe down / "I"), works even in guess mode
    } else if (reannounced && hints) {
      showFor(video); // mid-song re-announce — normal mode only, never spoils guess mode
    } else if (hints && (trackChanged || hintsTurnedOn)) {
      showFor(video); // normal auto-show
    } else if (!hints && trackChanged) {
      hideNow(); // new track in guessing mode: keep it hidden
    }
  }

  function showFor(video) {
    v = video;
    visible = false;
    clearTimeout(timer);
    // next microtask flips it on so the slide-in animation restarts
    requestAnimationFrame(() => {
      visible = true;
      timer = setTimeout(() => (visible = false), LOWER_THIRD_MS);
    });
  }

  function hideNow() {
    clearTimeout(timer);
    visible = false;
  }
</script>

{#if v}
  <div id="lower-third" class:show={visible} class:hide={!visible}>
    <div class="lt-bar"></div>
    <div class="lt-text">
      <div class="lt-artist">{v.artist}</div>
      <div class="lt-title">{v.title}</div>
      <div class="lt-meta">
        {v.year} · {v.genre}{v.country ? ` · ${v.country}` : ''}
        {#if $favorites.has(v.video_id)}<span class="lt-fav" aria-label="Favourite">★</span>{/if}
      </div>
    </div>
  </div>
{/if}

<style>
  #lower-third {
    position: absolute;
    left: env(safe-area-inset-left, 0px);
    bottom: calc(clamp(28px, 9vh, 90px) + env(safe-area-inset-bottom, 0px));
    z-index: 8;
    display: flex;
    align-items: stretch;
    transform: translateX(-110%);
    opacity: 0;
    pointer-events: none;
  }
  #lower-third.show {
    animation: lt-in 0.55s cubic-bezier(0.2, 0.9, 0.25, 1) forwards;
  }
  #lower-third.hide {
    animation: lt-out 0.6s ease forwards;
  }
  @keyframes lt-in {
    from {
      transform: translateX(-110%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  @keyframes lt-out {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(-8%);
      opacity: 0;
    }
  }
  .lt-bar {
    width: 10px;
    background: var(--accent);
    box-shadow: 0 0 18px var(--accent);
  }
  .lt-text {
    background: linear-gradient(90deg, rgba(0, 0, 0, 0.82) 0%, rgba(0, 0, 0, 0.55) 100%);
    backdrop-filter: blur(3px);
    padding: 12px 40px 14px 20px;
    border-left: 2px solid rgba(255, 255, 255, 0.08);
  }
  .lt-artist {
    font-family: 'Anton', sans-serif;
    font-size: clamp(26px, 4.6vw, 56px);
    line-height: 1;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .lt-title {
    font-family: 'Archivo', sans-serif;
    font-weight: 700;
    font-size: clamp(15px, 2.2vw, 26px);
    margin-top: 4px;
    color: #fff;
  }
  .lt-meta {
    font-family: 'VT323', monospace;
    font-size: clamp(15px, 1.9vw, 22px);
    letter-spacing: 2px;
    color: var(--accent-2);
    margin-top: 6px;
    text-transform: uppercase;
  }
  .lt-fav {
    color: var(--bug-yellow);
    margin-left: 10px;
    text-shadow: 0 0 6px var(--bug-yellow);
    display: inline-block;
    animation: lt-fav-glitch 0.7s steps(1, end) both;
  }
  @keyframes lt-fav-glitch {
    0% {
      opacity: 0;
      transform: translate(-1px, 0);
      text-shadow:
        2px 0 0 #ff00ea,
        -2px 0 0 #00f0ff,
        0 0 6px var(--bug-yellow);
    }
    12% {
      opacity: 1;
      transform: translate(2px, -1px);
      text-shadow:
        -3px 0 0 #ff00ea,
        3px 0 0 #00f0ff,
        0 0 6px var(--bug-yellow);
    }
    22% {
      opacity: 0.35;
      transform: translate(-2px, 1px);
    }
    34% {
      opacity: 1;
      transform: translate(1px, 2px);
      text-shadow:
        2px 0 0 #ff00ea,
        -2px 0 0 #00f0ff,
        0 0 6px var(--bug-yellow);
    }
    48% {
      opacity: 0.7;
      transform: translate(-1px, -2px);
    }
    62% {
      opacity: 1;
      transform: translate(1px, 0);
      text-shadow:
        -1px 0 0 #ff00ea,
        1px 0 0 #00f0ff,
        0 0 6px var(--bug-yellow);
    }
    100% {
      opacity: 1;
      transform: translate(0, 0);
      text-shadow: 0 0 6px var(--bug-yellow);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .lt-fav {
      animation: none;
    }
  }
</style>

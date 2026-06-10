<script>
  import {
    currentVideo,
    hintsOn,
    revealHint,
    reannounce,
    adPlaying,
    favorites,
  } from '../lib/stores.js';
  import { LOWER_THIRD_MS, LOWER_THIRD_TRACK_CHANGE_DELAY_MS } from '../lib/constants.js';

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
    } else if (hints && trackChanged) {
      // Track change auto-show is delayed so the music can breathe for a beat
      // before the title slides in (MTV "guess the song" feel). Manual reveals
      // and the hints-toggle path stay immediate because the user asked.
      showFor(video, LOWER_THIRD_TRACK_CHANGE_DELAY_MS);
    } else if (hints && hintsTurnedOn) {
      showFor(video); // user just flipped hints on — surface info immediately
    } else if (!hints && trackChanged) {
      hideNow(); // new track in guessing mode: keep it hidden
    }
  }

  function showFor(video, delayMs = 0) {
    v = video;
    visible = false;
    clearTimeout(timer);
    // next microtask flips it on so the slide-in animation restarts
    const reveal = () => {
      requestAnimationFrame(() => {
        visible = true;
        clearTimeout(timer);
        timer = setTimeout(() => (visible = false), LOWER_THIRD_MS);
      });
    };
    if (delayMs > 0) {
      timer = setTimeout(reveal, delayMs);
    } else {
      reveal();
    }
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
  /* Text-shadow RGB split on the artist line — applied directly to the text
     glyphs so the chromatic aberration reads, instead of bleeding around the
     dark background block. Stepped frames during the second half of the slide. */
  @keyframes lt-text-glitch {
    0%,
    45% {
      text-shadow: none;
      transform: translate(0, 0);
    }
    55% {
      text-shadow:
        3px 0 0 var(--accent),
        -3px 0 0 var(--accent-2);
      transform: translate(-2px, 0);
    }
    68% {
      text-shadow:
        -3px 0 0 var(--accent),
        3px 0 0 var(--accent-2);
      transform: translate(2px, 1px);
    }
    80% {
      text-shadow:
        2px 0 0 var(--accent),
        -2px 0 0 var(--accent-2);
      transform: translate(-1px, 0);
    }
    88%,
    100% {
      text-shadow: none;
      transform: translate(0, 0);
    }
  }
  /* Periodic re-glitch while the lower-third is visible — short burst once
     per cycle, the rest quiet. Artist and title use the same keyframe but
     are out-of-phase via different animation-delays so the bursts don't
     line up exactly. */
  @keyframes lt-text-idle-glitch {
    0%,
    5% {
      text-shadow: none;
      transform: translate(0, 0);
    }
    6% {
      text-shadow:
        2px 0 0 var(--accent),
        -2px 0 0 var(--accent-2);
      transform: translate(-1px, 0);
    }
    9% {
      text-shadow:
        -2px 0 0 var(--accent),
        2px 0 0 var(--accent-2);
      transform: translate(1px, 1px);
    }
    12% {
      text-shadow:
        1px 0 0 var(--accent),
        -1px 0 0 var(--accent-2);
      transform: translate(0, 0);
    }
    15%,
    100% {
      text-shadow: none;
      transform: translate(0, 0);
    }
  }
  /* Accent bar flickers through alt colours mid-entrance for the VHS punch. */
  @keyframes lt-bar-glitch {
    0%,
    50% {
      background: var(--accent);
      box-shadow: 0 0 18px var(--accent);
    }
    60% {
      background: var(--accent-2);
      box-shadow: 0 0 18px var(--accent-2);
    }
    72% {
      background: var(--accent);
      box-shadow: 0 0 18px var(--accent);
    }
    84% {
      background: var(--bug-yellow);
      box-shadow: 0 0 18px var(--bug-yellow);
    }
    100% {
      background: var(--accent);
      box-shadow: 0 0 18px var(--accent);
    }
  }
  /* Periodic bar colour flicker — same pacing as the text idle glitch. */
  @keyframes lt-bar-idle-glitch {
    0%,
    5% {
      background: var(--accent);
      box-shadow: 0 0 18px var(--accent);
    }
    6% {
      background: var(--accent-2);
      box-shadow: 0 0 18px var(--accent-2);
    }
    9% {
      background: var(--bug-yellow);
      box-shadow: 0 0 18px var(--bug-yellow);
    }
    12% {
      background: var(--accent);
      box-shadow: 0 0 18px var(--accent);
    }
    15%,
    100% {
      background: var(--accent);
      box-shadow: 0 0 18px var(--accent);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .lt-artist,
    .lt-title,
    .lt-bar {
      animation: none !important;
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
  #lower-third.show .lt-bar {
    animation:
      lt-bar-glitch 0.55s steps(1, end),
      lt-bar-idle-glitch 5s steps(1, end) 1.4s infinite;
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
  #lower-third.show .lt-artist {
    animation:
      lt-text-glitch 0.55s steps(1, end),
      lt-text-idle-glitch 5s steps(1, end) 1.2s infinite;
  }
  #lower-third.show .lt-title {
    animation:
      lt-text-glitch 0.55s steps(1, end) 40ms,
      lt-text-idle-glitch 5s steps(1, end) 1.6s infinite;
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

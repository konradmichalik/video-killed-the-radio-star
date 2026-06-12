<!-- src/components/game/PhoneRoomView.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import Scoreboard from './Scoreboard.svelte';
  import YearInput from './YearInput.svelte';
  import NetworkBadge from './NetworkBadge.svelte';

  export let player; // {id, name}
  export let roomCode;
  export let session;
  export let scoreboard = [];
  export let mySubmission = null;
  export let connectionStatus = 'open';
  export let unreachableReason = null; // 'room-not-found' | 'timeout' | 'broker-down'
  export let lastReveal = null; // { year, title, artist, winners, submissions, points }
  export let yearMin = 1900;
  export let yearMax = new Date().getFullYear();

  const dispatch = createEventDispatcher();
  let editingName = !player?.name;
  let nameDraft = player?.name || '';

  const saveName = () => {
    dispatch('setName', { name: nameDraft.trim() });
    editingName = false;
  };
  const lock = (e) => dispatch('guess', { year: e.detail.year });

  $: phase = session?.phase || 'idle';

  // Reveal feedback derived from props (no mutation, no side effects).
  $: myGuessYear = lastReveal?.submissions?.[player?.id]?.year ?? mySubmission?.year ?? null;
  $: actualYear = lastReveal?.year ?? null;
  $: delta = actualYear != null && myGuessYear != null ? Math.abs(actualYear - myGuessYear) : null;
  $: didWin = !!(player?.id && lastReveal?.winners?.includes(player.id));
  // Bonus pill shown when this player won AND the host had EXACT BONUS on AND
  // the winning guess hit on the nose. `points` is included on the reveal
  // payload from the host (see App.svelte onConnectedReveal); falls back to
  // `false` for older hosts that don't include the field.
  $: exactBonus = didWin && delta === 0 && lastReveal?.points === 2;

  // Mood bucket for the post-reveal animation: exact hit, close call, or
  // off the mark. Drives the .mood-* class on the reveal-card and the label
  // text below. No-guess players fall into FAR — same OFF THE MARK styling
  // rather than a featureless reveal.
  $: feedbackMood = delta == null ? 'far' : delta === 0 ? 'exact' : delta <= 5 ? 'close' : 'far';
  $: moodLabel =
    feedbackMood === 'exact'
      ? '★ BULLSEYE'
      : feedbackMood === 'close'
        ? 'CLOSE CALL'
        : 'OFF THE MARK';

  // Collapsed-by-default scoreboard so the prompt + year input dominate the
  // phone viewport. The collapsed state shows just this player's rank/score;
  // tapping the row expands the full sorted board with a max-height + scroll.
  let scoreboardExpanded = false;
  $: sortedBoard = [...scoreboard].sort((a, b) => (b.score || 0) - (a.score || 0));
  $: myRank = (() => {
    const i = sortedBoard.findIndex((p) => p.id === player?.id);
    return i === -1 ? null : i + 1;
  })();
  $: myScore = sortedBoard.find((p) => p.id === player?.id)?.score ?? 0;
  $: totalPlayers = sortedBoard.length;

  // When the host ends the session we surface a brief "Game ended" view with
  // the final standings instead of dropping back to the "waiting for host"
  // prompt. We flip the local flag once we observe a session AND then watch
  // for it disappearing — the welcome scoreboard alone is not enough.
  let everHadSession = false;
  let sessionEnded = false;
  $: if (session) {
    everHadSession = true;
    sessionEnded = false;
  } else if (everHadSession) {
    sessionEnded = true;
  }
  function dismissEnded() {
    sessionEnded = false;
    everHadSession = false;
  }

  // Reason-specific copy for the unreachable card. 'timeout' is the WebRTC
  // failure mode (different networks, guest/office Wi-Fi with client
  // isolation) — the one actionable hint we can give without a TURN relay.
  const unreachableCopy = {
    'room-not-found': {
      title: 'Room not found',
      text: 'This room is not open (anymore). Check the code on the TV or scan the QR code again.',
    },
    timeout: {
      title: "Can't reach the TV",
      text: 'Make sure this phone and the TV are on the same Wi-Fi. Guest, hotel and office networks often block connections between devices.',
    },
    'broker-down': {
      title: 'Connection service unavailable',
      text: 'The signaling server could not be reached. Check your internet connection and try again.',
    },
  };
  $: unreachableInfo = unreachableCopy[unreachableReason] || unreachableCopy.timeout;

  // A full reload is the honest retry: it re-runs the broker probe and the
  // whole join handshake with a clean PeerJS instance.
  const retry = () => globalThis.location.reload();

  // Only take over the screen when the join itself failed (no session yet).
  // Mid-game, 'unreachable' can simply mean the broker websocket dropped
  // while the P2P data channel still works — keep the game UI playable and
  // let the banner carry the status instead.
  $: showUnreachableCard = connectionStatus === 'unreachable' && !session;
</script>

<section class="phone">
  {#if connectionStatus !== 'open' && !showUnreachableCard}
    <div class="banner">Connection: {connectionStatus}</div>
  {/if}

  <header>
    <div class="room-line">
      <span class="room-label">ROOM</span>
      <span class="room-code">{roomCode}</span>
      <NetworkBadge status={connectionStatus} />
    </div>
    {#if editingName}
      <div class="name-row">
        <input bind:value={nameDraft} placeholder="Your name" maxlength="20" />
        <button class="save" on:click={saveName}>Save</button>
      </div>
    {:else}
      <div class="name-row">
        <span class="you-label">You: <strong>{player.name}</strong></span>
        <button
          class="ghost"
          on:click={() => {
            editingName = true;
          }}>Change</button
        >
      </div>
    {/if}
  </header>

  <main>
    {#if showUnreachableCard}
      <div class="unreachable-card" role="alert">
        <p class="unreachable-title">{unreachableInfo.title}</p>
        <p class="unreachable-text">{unreachableInfo.text}</p>
        <button class="retry" type="button" on:click={retry}>Try again</button>
      </div>
    {:else if sessionEnded}
      <div class="reveal-card ended">
        <p class="reveal-label">Game ended</p>
        <p class="ended-headline">Thanks for playing!</p>
        <h4 class="board-title">Final scoreboard</h4>
        <!-- Scroll-cap so the Dismiss button stays in view with a full roster
             (up to MAX_PLAYERS = 16). Without this, 12+ players push Dismiss
             below the fold and the user has to scroll to leave the screen. -->
        <div class="board-final">
          <Scoreboard players={scoreboard} highlightId={player?.id} />
        </div>
        <!-- Browsers don't let us close the tab programmatically (the tab
             wasn't opened by script), so the best we can do is ask. -->
        <p class="ended-cta">You can close this tab now.</p>
        <button class="ghost" type="button" on:click={dismissEnded}>Dismiss</button>
      </div>
    {:else if !session}
      <p class="msg">Waiting for host to start a game…</p>
    {:else if phase === 'idle'}
      <p class="msg">Get ready — round {session.round} is about to start.</p>
    {:else if phase === 'guessing'}
      {#if mySubmission}
        <p class="msg locked">
          Locked in: <strong>{mySubmission.year}</strong>. Waiting for reveal…
        </p>
      {:else}
        <h3 class="prompt">What year is this track?</h3>
        <YearInput min={yearMin} max={yearMax} on:lock={lock} />
      {/if}
    {:else}
      <div
        class="reveal-card"
        class:mood-exact={actualYear != null && feedbackMood === 'exact'}
        class:mood-close={actualYear != null && feedbackMood === 'close'}
        class:mood-far={actualYear != null && feedbackMood === 'far'}
      >
        {#if actualYear != null}
          <p class="mood-label">{moodLabel}</p>
          <p class="reveal-year">{actualYear}</p>
          {#if lastReveal?.artist || lastReveal?.title}
            <p class="reveal-track">
              {lastReveal?.artist ?? ''}{lastReveal?.artist && lastReveal?.title
                ? ' — '
                : ''}{lastReveal?.title ?? ''}
            </p>
          {/if}
          {#if myGuessYear != null}
            <p class="reveal-guess">
              Your guess: <strong>{myGuessYear}</strong>
              {#if delta === 0}
                — spot on!
              {:else if delta != null}
                — off by {delta} year{delta === 1 ? '' : 's'}
              {/if}
            </p>
          {:else}
            <p class="reveal-guess miss">No guess submitted this round.</p>
          {/if}
          {#if didWin}
            <p class="reveal-badge win" class:exact={exactBonus}>
              {exactBonus ? '★ Exact! +2 points' : 'You got the point!'}
            </p>
          {:else}
            <p class="reveal-badge">Closer luck next round.</p>
          {/if}
        {:else}
          <p class="msg reveal">Reveal! Scoreboard updating…</p>
        {/if}
      </div>
    {/if}
  </main>

  {#if !sessionEnded}
    <footer>
      <button
        type="button"
        class="board-toggle"
        aria-expanded={scoreboardExpanded}
        on:click={() => (scoreboardExpanded = !scoreboardExpanded)}
      >
        {#if myRank}
          <span class="rank">#{myRank}</span>
          <span class="meta">of {totalPlayers}</span>
          <span class="dot" aria-hidden="true">·</span>
          <span class="pts">{myScore} pts</span>
        {:else}
          <span class="meta">Scoreboard</span>
        {/if}
        <span class="chev" aria-hidden="true">{scoreboardExpanded ? '▴' : '▾'}</span>
      </button>
      {#if scoreboardExpanded}
        <div class="board-expand">
          <Scoreboard players={scoreboard} highlightId={player?.id} />
        </div>
      {/if}
    </footer>
  {/if}
</section>

<style>
  .phone {
    display: grid;
    gap: 18px;
  }
  .banner {
    padding: 8px 12px;
    background: var(--bug-yellow);
    color: #050505;
    border: 3px solid #050505;
    box-shadow: 4px 4px 0 #050505;
    text-align: center;
    font-family: 'Anton', sans-serif;
    font-size: 16px;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  header {
    display: grid;
    gap: 12px;
  }
  .room-line {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .room-label {
    font-family: 'VT323', monospace;
    font-size: 16px;
    letter-spacing: 3px;
    color: rgba(255, 255, 255, 0.55);
  }
  .room-code {
    font-family: 'Anton', sans-serif;
    font-size: clamp(22px, 5vw, 30px);
    letter-spacing: 5px;
    color: var(--bug-yellow);
    background: #050505;
    border: 2px solid #050505;
    padding: 2px 10px;
  }
  .name-row {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }
  .you-label {
    flex: 1;
    font-family: 'VT323', monospace;
    font-size: 18px;
    letter-spacing: 2px;
    color: rgba(255, 255, 255, 0.7);
  }
  .you-label strong {
    color: #fff;
    text-transform: uppercase;
  }

  input {
    flex: 1 1 140px;
    min-height: 44px;
    padding: 6px 12px;
    font-family: 'VT323', monospace;
    font-size: 20px;
    letter-spacing: 2px;
    color: #fff;
    background: rgba(0, 0, 0, 0.45);
    border: 3px solid #fff;
    outline: none;
  }
  input:focus-visible {
    border-color: var(--accent-2);
  }
  .save {
    min-height: 44px;
    padding: 0 18px;
    font-family: 'Anton', sans-serif;
    font-size: 18px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #050505;
    background: var(--accent-2);
    border: 3px solid #050505;
    cursor: pointer;
    box-shadow: 4px 4px 0 #050505;
    transition:
      transform 0.1s ease,
      box-shadow 0.1s ease;
  }
  .save:hover {
    box-shadow: 6px 6px 0 #050505;
    transform: translate(-1px, -1px);
  }
  .save:active {
    transform: translate(2px, 2px);
    box-shadow: 0 0 0 #050505;
  }
  .ghost {
    min-height: 40px;
    padding: 0 14px;
    font-family: 'Anton', sans-serif;
    font-size: 14px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #fff;
    background: transparent;
    border: 2px solid #fff;
    cursor: pointer;
    transition:
      color 0.12s ease,
      border-color 0.12s ease,
      box-shadow 0.1s ease,
      transform 0.1s ease;
  }
  .ghost:hover {
    color: var(--accent);
    border-color: var(--accent);
    box-shadow: 3px 3px 0 var(--accent);
    transform: translate(-1px, -1px);
  }
  .ghost:active {
    transform: translate(2px, 2px);
    box-shadow: 0 0 0 var(--accent);
  }

  .unreachable-card {
    display: grid;
    gap: 12px;
    padding: 18px;
    background: rgba(255, 0, 100, 0.08);
    border: 3px solid var(--accent);
    box-shadow: 5px 5px 0 var(--accent);
  }
  .unreachable-title {
    margin: 0;
    font-family: 'Anton', sans-serif;
    font-size: clamp(20px, 4.5vw, 26px);
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--accent);
  }
  .unreachable-text {
    margin: 0;
    font-family: 'VT323', monospace;
    font-size: 19px;
    letter-spacing: 1px;
    color: rgba(255, 255, 255, 0.85);
  }
  .retry {
    justify-self: start;
    min-height: 44px;
    padding: 0 18px;
    font-family: 'Anton', sans-serif;
    font-size: 18px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #050505;
    background: var(--bug-yellow);
    border: 3px solid #050505;
    cursor: pointer;
    box-shadow: 4px 4px 0 #050505;
    transition:
      transform 0.1s ease,
      box-shadow 0.1s ease;
  }
  .retry:hover {
    box-shadow: 6px 6px 0 #050505;
    transform: translate(-1px, -1px);
  }
  .retry:active {
    transform: translate(2px, 2px);
    box-shadow: 0 0 0 #050505;
  }

  .msg {
    margin: 0;
    padding: 14px;
    background: rgba(255, 255, 255, 0.04);
    border: 3px solid #fff;
    box-shadow: 5px 5px 0 var(--accent-2);
    font-family: 'VT323', monospace;
    font-size: 20px;
    letter-spacing: 2px;
    color: rgba(255, 255, 255, 0.8);
  }
  .msg strong {
    color: var(--bug-yellow);
  }
  .msg.reveal {
    box-shadow: 5px 5px 0 var(--bug-yellow);
    color: var(--bug-yellow);
  }
  .prompt {
    margin: 0 0 12px;
    font-family: 'Anton', sans-serif;
    font-size: clamp(22px, 4vw, 30px);
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #fff;
  }
  .board-title {
    margin: 0 0 10px;
    font-family: 'Anton', sans-serif;
    font-size: 18px;
    letter-spacing: 3px;
    color: var(--accent-2);
    text-transform: uppercase;
  }

  .reveal-card {
    display: grid;
    gap: 10px;
    padding: 18px;
    background: rgba(255, 255, 255, 0.04);
    border: 3px solid #fff;
    box-shadow: 5px 5px 0 var(--bug-yellow);
  }
  .reveal-label {
    margin: 0;
    font-family: 'VT323', monospace;
    font-size: 16px;
    letter-spacing: 3px;
    color: rgba(255, 255, 255, 0.55);
    text-transform: uppercase;
  }
  .reveal-year {
    margin: 0;
    font-family: 'Anton', sans-serif;
    font-size: clamp(54px, 12vw, 96px);
    letter-spacing: 6px;
    line-height: 1;
    color: var(--bug-yellow);
    font-variant-numeric: tabular-nums;
    text-shadow: 4px 4px 0 #050505;
    animation:
      pr-year-glitch-in 0.8s steps(1, end),
      pr-year-glitch-idle 6s steps(1, end) 2s infinite;
  }
  /* Entrance VHS-tracking burst on the revealed year. Scaled down vs the
     TV-side RevealOverlay (smaller font + tighter offsets) so it reads on
     a phone but keeps the same chromatic-aberration vocabulary. */
  @keyframes pr-year-glitch-in {
    0% {
      opacity: 0;
      transform: translate(0, 0) scale(0.94);
      text-shadow:
        4px 4px 0 #050505,
        5px 0 0 var(--accent),
        -5px 0 0 var(--accent-2);
    }
    12% {
      opacity: 1;
      transform: translate(-3px, 1px) scale(1.04);
      text-shadow:
        4px 4px 0 #050505,
        4px 0 0 var(--accent),
        -4px 0 0 var(--accent-2);
      clip-path: inset(0 0 35% 0);
    }
    26% {
      transform: translate(2px, -1px) scale(1);
      text-shadow:
        4px 4px 0 #050505,
        -3px 0 0 var(--accent),
        3px 0 0 var(--accent-2);
      clip-path: inset(0 0 0 0);
    }
    40% {
      transform: translate(0, 1px);
      text-shadow:
        4px 4px 0 #050505,
        2px 0 0 var(--bug-yellow),
        -2px 0 0 var(--accent-2);
      clip-path: inset(35% 0 0 0);
    }
    55% {
      transform: translate(-1px, 0);
      text-shadow:
        4px 4px 0 #050505,
        1px 0 0 var(--accent),
        -1px 0 0 var(--accent-2);
      clip-path: inset(0 0 0 0);
    }
    72%,
    100% {
      transform: translate(0, 0);
      text-shadow: 4px 4px 0 #050505;
    }
  }
  @keyframes pr-year-glitch-idle {
    0%,
    90%,
    100% {
      transform: translate(0, 0);
      text-shadow: 4px 4px 0 #050505;
    }
    92% {
      transform: translate(-1px, 0);
      text-shadow:
        4px 4px 0 #050505,
        2px 0 0 var(--accent),
        -2px 0 0 var(--accent-2);
    }
    95% {
      transform: translate(1px, 1px);
      text-shadow:
        4px 4px 0 #050505,
        -2px 0 0 var(--accent),
        2px 0 0 var(--accent-2);
    }
    97% {
      transform: translate(0, 0);
      text-shadow:
        4px 4px 0 #050505,
        1px 0 0 var(--accent),
        -1px 0 0 var(--accent-2);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .reveal-year {
      animation: none;
    }
  }
  .reveal-track {
    margin: 0;
    font-family: 'VT323', monospace;
    font-size: 18px;
    letter-spacing: 2px;
    color: #fff;
  }
  .reveal-guess {
    margin: 6px 0 0;
    font-family: 'VT323', monospace;
    font-size: 20px;
    letter-spacing: 2px;
    color: rgba(255, 255, 255, 0.85);
  }
  .reveal-guess strong {
    color: var(--accent-2);
  }
  .reveal-guess.miss {
    color: rgba(255, 255, 255, 0.6);
  }
  .reveal-badge {
    margin: 8px 0 0;
    padding: 10px 14px;
    font-family: 'Anton', sans-serif;
    font-size: 20px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #fff;
    background: transparent;
    border: 3px solid #fff;
  }
  .reveal-badge.win {
    color: #050505;
    background: var(--accent);
    border-color: #050505;
    box-shadow: 4px 4px 0 #050505;
  }
  .reveal-badge.win.exact {
    background: var(--bug-yellow);
    box-shadow: 6px 6px 0 #050505;
  }

  .reveal-card.ended {
    box-shadow: 5px 5px 0 var(--accent-2);
  }
  .board-final {
    max-height: 50vh;
    overflow-y: auto;
    padding-right: 2px;
  }

  /* Mood feedback — three brutalist responses to the player's distance.
     Border + shadow colour replaces the default yellow; a steps()-based
     entry keyframe gives the jagged VHS feel. The base reveal-card layout
     (padding, gap, background, border thickness) is preserved. */
  .reveal-card.mood-exact {
    border-color: var(--bug-yellow);
    box-shadow: 5px 5px 0 var(--bug-yellow);
    animation: mood-exact-in 1.1s steps(1, end);
  }
  .reveal-card.mood-close {
    border-color: var(--accent-2);
    box-shadow: 5px 5px 0 var(--accent-2);
    animation: mood-close-in 0.9s steps(1, end);
  }
  .reveal-card.mood-far {
    border-color: var(--accent);
    box-shadow: 5px 5px 0 var(--accent);
    animation: mood-far-in 1s steps(1, end);
  }

  /* Mood-specific label — replaces the generic "Actual year" caption with
     a stimmung-bezogene tagline. Uses Anton to match the reveal-year
     hierarchy and the same RGB-split glitch vocabulary as the year burst. */
  .mood-label {
    margin: 0;
    font-family: 'Anton', sans-serif;
    font-size: clamp(20px, 3.6vw, 26px);
    letter-spacing: 4px;
    text-transform: uppercase;
    text-shadow: 2px 2px 0 #050505;
  }
  .mood-exact .mood-label {
    color: var(--bug-yellow);
    animation: mood-label-burst 700ms steps(1, end);
  }
  .mood-close .mood-label {
    color: var(--accent-2);
    animation: mood-label-burst 500ms steps(1, end);
  }
  .mood-far .mood-label {
    color: var(--accent);
    animation: mood-label-burst 600ms steps(1, end);
  }

  @keyframes mood-exact-in {
    0% {
      transform: translate(0, 12px) scale(0.94);
      box-shadow:
        8px 8px 0 var(--bug-yellow),
        0 0 0 0 transparent;
      background: rgba(255, 255, 255, 0.04);
    }
    10% {
      transform: translate(-4px, 4px) scale(1.04);
      box-shadow:
        8px 8px 0 var(--bug-yellow),
        0 0 32px rgba(255, 220, 0, 0.8);
      background: rgba(255, 220, 0, 0.26);
    }
    24% {
      transform: translate(3px, -2px) scale(1.02);
      box-shadow:
        6px 6px 0 var(--bug-yellow),
        0 0 22px rgba(255, 220, 0, 0.55);
      background: rgba(255, 220, 0, 0.14);
    }
    42% {
      transform: translate(-1px, 1px) scale(1);
      box-shadow:
        6px 6px 0 var(--bug-yellow),
        0 0 10px rgba(255, 220, 0, 0.3);
      background: rgba(255, 220, 0, 0.06);
    }
    70%,
    100% {
      transform: translate(0, 0);
      box-shadow: 5px 5px 0 var(--bug-yellow);
      background: rgba(255, 255, 255, 0.04);
    }
  }

  @keyframes mood-close-in {
    0% {
      transform: translate(-5px, 6px);
      box-shadow:
        8px 8px 0 var(--accent-2),
        -3px 0 0 var(--accent),
        3px 0 0 var(--bug-yellow);
    }
    15% {
      transform: translate(4px, -2px);
      box-shadow:
        6px 6px 0 var(--accent-2),
        2px 0 0 var(--accent),
        -2px 0 0 var(--bug-yellow);
    }
    35% {
      transform: translate(-2px, 1px);
      box-shadow: 6px 6px 0 var(--accent-2);
    }
    60%,
    100% {
      transform: translate(0, 0);
      box-shadow: 5px 5px 0 var(--accent-2);
    }
  }

  @keyframes mood-far-in {
    0% {
      transform: translate(3px, -8px);
      box-shadow: 8px 8px 0 var(--accent);
      background: rgba(255, 0, 100, 0.18);
    }
    10% {
      transform: translate(-5px, 3px);
      box-shadow:
        6px 6px 0 var(--accent),
        -4px 0 0 var(--accent-2);
      background: rgba(255, 0, 100, 0.1);
    }
    28% {
      transform: translate(4px, -1px);
      box-shadow: 6px 6px 0 var(--accent);
      background: rgba(255, 0, 100, 0.05);
    }
    50%,
    100% {
      transform: translate(0, 0);
      box-shadow: 5px 5px 0 var(--accent);
      background: rgba(255, 255, 255, 0.04);
    }
  }

  /* Tiny chromatic-aberration burst on the mood label — matches the
     reveal-year's pr-year-glitch-in vocabulary at a smaller scale. */
  @keyframes mood-label-burst {
    0% {
      opacity: 0;
      transform: translate(-3px, 0);
      text-shadow:
        2px 2px 0 #050505,
        4px 0 0 var(--accent),
        -4px 0 0 var(--accent-2);
    }
    20% {
      opacity: 1;
      transform: translate(2px, 0);
      text-shadow:
        2px 2px 0 #050505,
        -3px 0 0 var(--accent),
        3px 0 0 var(--accent-2);
    }
    45% {
      transform: translate(-1px, 0);
      text-shadow:
        2px 2px 0 #050505,
        2px 0 0 var(--accent-2);
    }
    70%,
    100% {
      transform: translate(0, 0);
      text-shadow: 2px 2px 0 #050505;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .reveal-card.mood-exact,
    .reveal-card.mood-close,
    .reveal-card.mood-far {
      animation: none;
    }
    .mood-exact .mood-label,
    .mood-close .mood-label,
    .mood-far .mood-label {
      animation: none;
    }
  }
  .ended-headline {
    margin: 0;
    font-family: 'Anton', sans-serif;
    font-size: clamp(28px, 6vw, 40px);
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--bug-yellow);
  }
  .ended-cta {
    margin: 4px 0 0;
    font-family: 'VT323', monospace;
    font-size: 18px;
    letter-spacing: 2px;
    color: rgba(255, 255, 255, 0.7);
    text-align: center;
  }

  .board-toggle {
    width: 100%;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.04);
    border: 3px solid #fff;
    box-shadow: 4px 4px 0 var(--accent-2);
    color: #fff;
    cursor: pointer;
    font-family: 'Anton', sans-serif;
    font-size: 18px;
    letter-spacing: 2px;
    text-transform: uppercase;
    text-align: left;
    transition:
      transform 0.1s ease,
      box-shadow 0.1s ease,
      border-color 0.12s ease;
  }
  .board-toggle:hover {
    border-color: var(--accent-2);
    transform: translate(-1px, -1px);
    box-shadow: 6px 6px 0 var(--accent-2);
  }
  .board-toggle:active {
    transform: translate(2px, 2px);
    box-shadow: 0 0 0 var(--accent-2);
  }
  .board-toggle .rank {
    color: var(--accent-2);
    font-size: 20px;
  }
  .board-toggle .meta {
    color: rgba(255, 255, 255, 0.6);
    font-family: 'VT323', monospace;
    font-size: 18px;
    letter-spacing: 1px;
    text-transform: none;
  }
  .board-toggle .dot {
    color: rgba(255, 255, 255, 0.45);
  }
  .board-toggle .pts {
    color: var(--bug-yellow);
    font-variant-numeric: tabular-nums;
  }
  .board-toggle .chev {
    margin-left: auto;
    color: var(--accent-2);
    font-size: 20px;
  }
  .board-expand {
    margin-top: 10px;
    max-height: 40vh;
    overflow-y: auto;
    padding-right: 2px;
  }
</style>

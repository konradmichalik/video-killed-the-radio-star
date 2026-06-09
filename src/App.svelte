<script>
  import { onMount, onDestroy, tick } from 'svelte';
  import { get } from 'svelte/store';
  import {
    videos,
    playlist,
    index,
    started,
    guideOpen,
    queueOpen,
    searchOpen,
    settingsOpen,
    controlsOpen,
    switching,
    crtOn,
    loadError,
    revealNowPlaying,
    currentVideo,
    hintsOn,
    devMode,
    videoReviews,
    skipReviewedOk,
    toggleFavorite,
    gameMode,
    room,
    guessStats,
  } from './lib/stores.js';
  import {
    startSession,
    startRound as reduceStartRound,
    reveal as reduceReveal,
    nextRound as reduceNextRound,
    endSession,
  } from './lib/multiplayer/state.js';
  import { nextGuessStats } from './lib/game.js';
  import { loadVideos, shuffle, filterVideos, yearRange } from './lib/data.js';
  import {
    loadYouTubeAPI,
    createPlayer,
    next,
    prev,
    toggle,
    toggleMute,
    armInitWatchdog,
    debugPlayerState,
  } from './lib/player.js';
  import { enableWakeLock } from './lib/wakelock.js';
  import { requestAppFullscreen } from './lib/fullscreen.js';
  import { loadFilters } from './lib/channel.js';
  import { phoneRoom } from './lib/stores.js';
  import { loadOrCreate, setName as persistName } from './lib/multiplayer/identity.js';
  import { isValidRoomId, generateRoomId } from './lib/multiplayer/room.js';
  import { hostRoom, joinRoom } from './lib/multiplayer/peer.js';
  import { encode, parseMessage } from './lib/multiplayer/protocol.js';
  import {
    addPlayer,
    markPlayerDisconnected,
    submitGuess as reduceSubmit,
  } from './lib/multiplayer/state.js';
  import { closestYearWinners } from './lib/multiplayer/scoring.js';

  import StartScreen from './components/StartScreen.svelte';
  import CrtOverlay from './components/CrtOverlay.svelte';
  import ChannelStatic from './components/ChannelStatic.svelte';
  import LowerThird from './components/LowerThird.svelte';
  import AdIndicator from './components/AdIndicator.svelte';
  import StationLogo from './components/StationLogo.svelte';
  import ProgressBar from './components/ProgressBar.svelte';
  import UpNext from './components/UpNext.svelte';
  import CenterFeedback from './components/CenterFeedback.svelte';
  import GuessGame from './components/GuessGame.svelte';
  import TitleMask from './components/TitleMask.svelte';
  import DevReview from './components/DevReview.svelte';
  import FirstRunHint from './components/FirstRunHint.svelte';
  import RotateHint from './components/RotateHint.svelte';
  import InstallHint from './components/InstallHint.svelte';
  import TouchOverlay from './components/TouchOverlay.svelte';
  import Guide from './components/Guide.svelte';
  import Queue from './components/Queue.svelte';
  import Search from './components/Search.svelte';
  import Settings from './components/Settings.svelte';
  import Controls from './components/Controls.svelte';
  import UnmuteHint from './components/UnmuteHint.svelte';
  import ErrorScreen from './components/ErrorScreen.svelte';
  import LazyGameSheet from './components/game/LazyGameSheet.svelte';

  const params = new URLSearchParams(globalThis.location?.search || '');
  const joinParam = params.get('join');
  const isPhoneMode = !!joinParam && isValidRoomId(joinParam);

  if (isPhoneMode) {
    const player = loadOrCreate();
    phoneRoom.update((s) => ({ ...s, roomCode: joinParam, player }));
  }

  let phoneClient = null;
  const PHONE_PEER_PREFIX = 'VKTRS-PEER-';

  async function startPhone() {
    if (!isPhoneMode) return;
    const me = get(phoneRoom).player;
    if (!me) return;
    const ownPeerId = PHONE_PEER_PREFIX + me.id;
    phoneRoom.update((s) => ({ ...s, connectionStatus: 'connecting' }));
    try {
      phoneClient = await joinRoom(PEER_PREFIX + joinParam, ownPeerId, {
        onOpen: () => {
          phoneRoom.update((s) => ({ ...s, connectionStatus: 'open' }));
          const p = get(phoneRoom).player;
          phoneClient?.send(
            encode('join', {
              playerId: p.id,
              name: p.name || 'Player',
            }),
          );
        },
        onMessage: (raw) => onTvMessage(raw),
        onClose: () => phoneRoom.update((s) => ({ ...s, connectionStatus: 'reconnecting' })),
        onReconnecting: () => phoneRoom.update((s) => ({ ...s, connectionStatus: 'reconnecting' })),
        onUnreachable: () => phoneRoom.update((s) => ({ ...s, connectionStatus: 'unreachable' })),
      });
    } catch (err) {
      console.error('phone-join failed', err);
      phoneRoom.update((s) => ({ ...s, connectionStatus: 'unreachable' }));
    }
  }

  function onTvMessage(raw) {
    const msg = parseMessage(raw);
    if (!msg) return;
    if (msg.type === 'welcome') {
      phoneRoom.update((s) => ({
        ...s,
        session: msg.payload.sessionState,
        scoreboard: msg.payload.scoreboard || [],
        yearRange: msg.payload.yearRange || { min: 1900, max: new Date().getFullYear() },
      }));
    } else if (msg.type === 'round') {
      phoneRoom.update((s) => ({
        ...s,
        session: { ...(s.session || {}), ...msg.payload },
        mySubmission: msg.payload.phase === 'guessing' ? null : s.mySubmission,
      }));
    } else if (msg.type === 'reveal') {
      phoneRoom.update((s) => ({
        ...s,
        session: { ...(s.session || {}), phase: 'revealed' },
      }));
    } else if (msg.type === 'score') {
      phoneRoom.update((s) => ({ ...s, scoreboard: msg.payload.scoreboard || [] }));
    } else if (msg.type === 'end') {
      phoneRoom.update((s) => ({ ...s, session: null }));
    } else if (msg.type === 'kick') {
      phoneClient?.close();
      phoneClient = null;
      phoneRoom.update((s) => ({ ...s, connectionStatus: 'unreachable' }));
    }
  }

  function onPhoneSetName(e) {
    const nextPlayer = persistName(e.detail.name);
    phoneRoom.update((s) => ({ ...s, player: nextPlayer }));
    phoneClient?.send(encode('join', { playerId: nextPlayer.id, name: nextPlayer.name }));
  }

  function onPhoneGuess(e) {
    phoneClient?.send(encode('guess', { year: e.detail.year }));
    phoneRoom.update((s) => ({ ...s, mySubmission: { year: e.detail.year } }));
  }

  onDestroy(() => {
    phoneClient?.close();
  });

  onMount(async () => {
    if (isPhoneMode) {
      await startPhone();
      enableWakeLock();
      return;
    }
    try {
      const all = await loadVideos();
      if (!Array.isArray(all) || all.length === 0) throw new Error('empty');
      videos.set(all);
      // restore the last channel (saved filters) if it still yields videos
      const saved = loadFilters();
      let queue = all;
      if (saved && Array.isArray(saved.genres)) {
        const f = filterVideos(all, {
          yearMin: saved.yearMin ?? -Infinity,
          yearMax: saved.yearMax ?? Infinity,
          genres: new Set(saved.genres),
          countries:
            Array.isArray(saved.countries) && saved.countries.length
              ? new Set(saved.countries)
              : null,
        });
        if (f.length) queue = f;
      }
      playlist.set(shuffle(queue));
      index.set(0);
    } catch {
      loadError.set('Could not load the channel data (videos.json).');
    }

    // Dev review console helpers — call from the browser DevTools.
    window.vktrsReviews = () => ({ ...get(videoReviews) });
    window.vktrsReviewsCount = () => {
      const r = get(videoReviews);
      const ids = Object.keys(r);
      const byStatus = {};
      let spoilerTitle = 0,
        spoilerYear = 0,
        withReplacement = 0;
      for (const v of Object.values(r)) {
        if (v.status) byStatus[v.status] = (byStatus[v.status] || 0) + 1;
        if (v.spoilerTitle) spoilerTitle++;
        if (v.spoilerYear) spoilerYear++;
        if (v.replacementId) withReplacement++;
      }
      return { reviewed: ids.length, spoilerTitle, spoilerYear, withReplacement, byStatus };
    };
    window.vktrsReviewsMarkdown = () => {
      const reviews = get(videoReviews);
      const byId = new Map(get(videos).map((v) => [v.video_id, v]));
      const rows = Object.entries(reviews).sort(([, a], [, b]) => {
        const av = byId.get(a) ?? {},
          bv = byId.get(b) ?? {};
        return (av.year ?? 0) - (bv.year ?? 0);
      });
      const lines = [`# VKTRS dev review — ${rows.length} track(s) reviewed`, ''];
      for (const [id, r] of rows) {
        const v = byId.get(id) ?? { artist: '?', title: '?', year: '?' };
        lines.push(`- **${v.artist} — ${v.title}** *(${v.year})* — \`${id}\``);
        const spoiler = [r.spoilerTitle && 'Titel/Artist', r.spoilerYear && 'Jahr']
          .filter(Boolean)
          .join(', ');
        if (spoiler) lines.push(`  - Spoiler: ${spoiler}`);
        if (r.status) lines.push(`  - Status: \`${r.status}\``);
        if (r.replacementId) lines.push(`  - Replacement: \`${r.replacementId}\``);
        if (r.notes) lines.push(`  - Notes: ${r.notes}`);
        if (r.reviewedAt) lines.push(`  - reviewed: ${r.reviewedAt}`);
      }
      const md = lines.join('\n');
      console.log(md);
      return md;
    };
    window.vktrsReviewsClear = () => {
      if (confirm('Wipe all video reviews?')) videoReviews.set({});
    };
    window.vktrsPlayerState = () => debugPlayerState();
  });

  // Not async: keep fullscreen + wake-lock requests inside the click gesture.
  function powerOn() {
    requestAppFullscreen(); // best-effort, must run in the gesture
    enableWakeLock(); // keep the screen on during playback
    started.set(true);
    switching.set(true); // "tuning in" static covers the warm-up until the first frame
    armInitWatchdog(); // show the test card if the player never starts
    tick().then(async () => {
      try {
        await loadYouTubeAPI();
        createPlayer('player');
      } catch {
        loadError.set('Could not load the YouTube player (network or content blocker?).');
      }
    });
  }

  // Auto-skip every track that already has any review status — only un-checked
  // tracks play in dev mode. Active only while dev mode is on so normal
  // playback is never silently filtered.
  let lastAutoSkipId = null;
  $: maybeAutoSkip($currentVideo, $videoReviews, $skipReviewedOk, $devMode, $started);
  function maybeAutoSkip(video, reviews, skipOn, devOn, started) {
    if (!started || !skipOn || !devOn || !video) return;
    const id = video.video_id;
    if (id === lastAutoSkipId) return; // don't skip the same id twice
    if (reviews[id]?.status) {
      lastAutoSkipId = id;
      setTimeout(() => next(), 250);
    }
  }

  // ----- Game Mode (TV side) ---------------------------------------------
  // These bits are only meaningful when NOT in phone mode. Phone mode renders
  // GameSheet at the top of the markup and exits early everywhere else.
  let gameSheetOpen = false;
  let roomCode = null;
  let joinUrl = '';
  // Solo self-rate state — only meaningful during Solo's 'revealed' phase.
  let soloRated = { year: false, title: false, artist: false };

  // Connected-mode host handle (PeerJS room). null when not hosting.
  let host = null;
  const PEER_PREFIX = 'VKTRS-';

  async function startConnectedRoom() {
    const code = generateRoomId();
    roomCode = code;
    joinUrl = `${globalThis.location.origin}${import.meta.env.BASE_URL}?join=${code}`;
    try {
      host = await hostRoom(PEER_PREFIX + code, {
        onJoin: (peerId) => {
          // Send a welcome snapshot to the joining peer.
          const r = get(room);
          host?.sendTo(
            peerId,
            encode('welcome', {
              sessionState: r.session,
              players: r.players,
              scoreboard: r.players.map(({ id, name, score }) => ({ id, name, score })),
              yearRange: yearRange(get(videos)),
            }),
          );
        },
        onLeave: (peerId) => {
          const playerId = peerId.replace(/^VKTRS-PEER-/, '');
          room.update((s) => markPlayerDisconnected(s, playerId));
        },
        onMessage: (peerId, raw) => onPeerMessage(peerId, raw),
      });
    } catch (err) {
      console.error('Failed to open room', err);
      // UI banner is added in Task 22.
    }
  }

  function onPeerMessage(peerId, raw) {
    const msg = parseMessage(raw);
    if (!msg) return;
    const playerId = peerId.replace(/^VKTRS-PEER-/, '');
    if (msg.type === 'join') {
      room.update((s) => addPlayer(s, { id: playerId, name: msg.payload.name || 'Player' }));
      broadcastScore();
    } else if (msg.type === 'guess') {
      const r = get(room);
      if (r.session?.phase === 'guessing') {
        room.update((s) => reduceSubmit(s, playerId, msg.payload.year));
      }
    }
  }

  function onConnectedReveal() {
    const r = get(room);
    const cv = get(currentVideo);
    const actual = cv?.year;
    const winners = closestYearWinners(r.submissions, actual);
    room.update((s) => reduceReveal(s, winners));
    host?.broadcast(
      encode('reveal', {
        year: actual,
        title: cv?.title,
        artist: cv?.artist,
        winners,
      }),
    );
    broadcastScore();
  }

  function broadcastScore() {
    const r = get(room);
    host?.broadcast(
      encode('score', {
        scoreboard: r.players.map(({ id, name, score }) => ({ id, name, score })),
      }),
    );
  }

  function closeConnectedRoom() {
    host?.close();
    host = null;
  }

  function onStartMode(e) {
    const mode = e.detail.mode;
    gameMode.set(mode);
    room.update((s) => startSession(s));
    if (mode === 'connected') startConnectedRoom();
  }

  function onStartRound() {
    const cv = get(currentVideo);
    room.update((s) => reduceStartRound(s, cv));
    soloRated = { year: false, title: false, artist: false };
    if (get(gameMode) === 'connected') {
      const r = get(room);
      host?.broadcast(encode('round', { round: r.session.round, phase: 'guessing' }));
    }
  }

  function onReveal() {
    if (get(gameMode) === 'solo') {
      room.update((s) => reduceReveal(s, []));
    } else {
      onConnectedReveal();
    }
  }

  function onNextRound() {
    room.update((s) => reduceNextRound(s));
    if (get(gameMode) === 'connected') {
      const r = get(room);
      host?.broadcast(encode('round', { round: r.session.round, phase: 'idle' }));
    }
  }

  function onEndSession() {
    if (get(gameMode) === 'connected') {
      host?.broadcast(
        encode('end', {
          finalScoreboard: get(room).players.map(({ id, name, score }) => ({ id, name, score })),
        }),
      );
      closeConnectedRoom();
    }
    room.update((s) => endSession(s));
    gameMode.set(null);
    roomCode = null;
    joinUrl = '';
  }

  // Solo self-rate: each tap counts as one "correct" toward the existing
  // guessStats tracker so the streak/best-of stats keep working.
  function onSoloRate(key) {
    if (soloRated[key]) return;
    soloRated = { ...soloRated, [key]: true };
    guessStats.update((s) => nextGuessStats(s, true));
  }

  // Keyboard / remote control (desktop). Ignored while typing in form controls.
  function onKey(e) {
    if (isPhoneMode) return;
    // Escape always closes an open panel, even when a control inside is focused
    if (e.key === 'Escape') {
      if ($controlsOpen) {
        e.preventDefault();
        controlsOpen.set(false);
        return;
      }
      if ($settingsOpen) {
        e.preventDefault();
        settingsOpen.set(false);
        return;
      }
      if ($guideOpen) {
        e.preventDefault();
        guideOpen.set(false);
        return;
      }
      if ($queueOpen) {
        e.preventDefault();
        queueOpen.set(false);
        return;
      }
      if ($searchOpen) {
        e.preventDefault();
        searchOpen.set(false);
        return;
      }
    }
    const t = e.target;
    if (t instanceof HTMLElement && t.matches('input, textarea, button, [role="switch"]')) return;
    if ($loadError) return;

    if (!$started) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        powerOn();
      }
      return;
    }
    // while a panel is open, don't let transport keys through
    if ($guideOpen || $queueOpen || $searchOpen || $settingsOpen || $controlsOpen) return;
    switch (e.key) {
      case ' ':
        e.preventDefault();
        toggle();
        break;
      case 'ArrowRight':
        e.preventDefault();
        next();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        prev();
        break;
      case 'ArrowUp':
        e.preventDefault();
        guideOpen.set(true);
        break;
      case 'ArrowDown':
        e.preventDefault();
        revealNowPlaying();
        break;
      case 'q':
      case 'Q':
        queueOpen.set(true);
        break;
      case '/':
        e.preventDefault();
        searchOpen.set(true);
        break;
      case 'i':
      case 'I':
        revealNowPlaying();
        break;
      case 'm':
      case 'M':
        toggleMute();
        break;
      case 'f':
      case 'F':
        requestAppFullscreen();
        break;
      case 'd':
      case 'D':
        e.preventDefault();
        devMode.update((v) => !v);
        break;
      case 's':
      case 'S':
        e.preventDefault();
        toggleFavorite($currentVideo?.video_id);
        break;
    }
  }
</script>

<svelte:window on:keydown={onKey} />

{#if isPhoneMode}
  <LazyGameSheet open={true} isPhone={true} on:setName={onPhoneSetName} on:guess={onPhoneGuess} />
{:else}
  <main
    id="tv"
    class:dimmed={$guideOpen || $queueOpen || $searchOpen || $settingsOpen || $controlsOpen}
    inert={$guideOpen ||
      $queueOpen ||
      $searchOpen ||
      $settingsOpen ||
      $controlsOpen ||
      !!$loadError ||
      undefined}
    aria-label="Music video channel"
  >
    <div id="player"></div>

    {#if $crtOn && $started}
      <CrtOverlay />
    {/if}

    {#if $started}
      {#if $gameMode !== 'connected' || $room.session?.phase !== 'guessing'}
        <LowerThird />
      {/if}
      <AdIndicator />
      <StationLogo />
      <ProgressBar />
      <UpNext />
      <GuessGame />
      <TitleMask />
      <CenterFeedback />
      <DevReview />
      <TouchOverlay />
      <ChannelStatic />
      <UnmuteHint />
      <FirstRunHint />
      <RotateHint />
    {/if}
  </main>

  <div class="sr-only" aria-live="polite" aria-atomic="true">
    {#if $started && $hintsOn && $currentVideo}
      Now playing: {$currentVideo.artist} – {$currentVideo.title}, {$currentVideo.year}
    {/if}
  </div>

  <Guide on:openGame={() => (gameSheetOpen = true)} />
  <Queue />
  <Search />
  <Settings />
  <Controls />

  {#if $gameMode !== null}
    {#await import('./components/game/GameRunningBadge.svelte') then m}
      <svelte:component this={m.default} on:open={() => (gameSheetOpen = true)} />
    {/await}
  {/if}

  {#if gameSheetOpen || $gameMode !== null}
    <LazyGameSheet
      open={gameSheetOpen}
      {roomCode}
      {joinUrl}
      on:close={() => (gameSheetOpen = false)}
      on:startMode={onStartMode}
      on:startRound={onStartRound}
      on:reveal={onReveal}
      on:nextRound={onNextRound}
      on:endSession={onEndSession}
    >
      <svelte:fragment slot="solo">
        {#if $room.session?.phase === 'revealed'}
          <div class="solo-rate">
            <p>Did you get it?</p>
            <button
              class="icon-btn"
              type="button"
              on:click={() => onSoloRate('year')}
              disabled={soloRated.year}>Year ✓</button
            >
            <button
              class="icon-btn"
              type="button"
              on:click={() => onSoloRate('title')}
              disabled={soloRated.title}>Title ✓</button
            >
            <button
              class="icon-btn"
              type="button"
              on:click={() => onSoloRate('artist')}
              disabled={soloRated.artist}>Artist ✓</button
            >
          </div>
        {/if}
      </svelte:fragment>
    </LazyGameSheet>
  {/if}

  {#if !$started && !$loadError}
    <StartScreen on:power={powerOn} />
    <InstallHint />
  {/if}

  <ErrorScreen />
{/if}

<style>
  #tv {
    position: fixed;
    inset: 0;
    background: #000;
    overflow: hidden;
    transition: filter var(--dur-panel) ease;
  }
  #tv.dimmed {
    filter: brightness(0.4);
  }
  .solo-rate {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }
  .solo-rate p {
    margin: 0;
    width: 100%;
  }
</style>

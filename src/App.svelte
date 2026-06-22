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
    skipReviewed,
    toggleFavorite,
    gameMode,
    room,
    resetGuessStats,
    autoStartRound,
    autoAdvanceReveal,
    autoCountdown,
    exactMatchBonus,
  } from './lib/stores.js';
  import {
    startSession,
    startRound as reduceStartRound,
    reveal as reduceReveal,
    nextRound as reduceNextRound,
    endSession,
  } from './lib/multiplayer/state.js';
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
    currentPlayerVideoId,
    nudgePlay,
  } from './lib/player.js';
  import { enableWakeLock } from './lib/wakelock.js';
  import { requestAppFullscreen } from './lib/fullscreen.js';
  import { loadFilters } from './lib/channel.js';
  import { phoneRoom, brokerReachable } from './lib/stores.js';
  import { loadOrCreate, setName as persistName } from './lib/multiplayer/identity.js';
  import { isValidRoomId, generateRoomId } from './lib/multiplayer/room.js';
  import { hostRoom, joinRoom, checkBrokerReachable } from './lib/multiplayer/peer.js';
  import { encode, parseMessage } from './lib/multiplayer/protocol.js';
  import {
    addPlayer,
    markPlayerDisconnected,
    submitGuess as reduceSubmit,
    setController,
  } from './lib/multiplayer/state.js';
  import { closestYearWinners } from './lib/multiplayer/scoring.js';
  import {
    AUTO_ADVANCE_REVEAL_MS,
    AUTO_ADVANCE_POLL_MS,
    AUTO_ADVANCE_TRACK_TIMEOUT_MS,
  } from './lib/constants.js';

  import StartScreen from './components/StartScreen.svelte';
  import CrtOverlay from './components/CrtOverlay.svelte';
  import ChannelStatic from './components/ChannelStatic.svelte';
  import LowerThird from './components/LowerThird.svelte';
  import GuessGame from './components/GuessGame.svelte';
  import AdIndicator from './components/AdIndicator.svelte';
  import StationLogo from './components/StationLogo.svelte';
  import ProgressBar from './components/ProgressBar.svelte';
  import UpNext from './components/UpNext.svelte';
  import CenterFeedback from './components/CenterFeedback.svelte';
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
  import PhoneShell from './components/game/PhoneShell.svelte';
  import RevealOverlay from './components/game/RevealOverlay.svelte';

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
    const unreachable = (reason) =>
      phoneRoom.update((s) => ({
        ...s,
        connectionStatus: 'unreachable',
        unreachableReason: reason,
      }));
    phoneRoom.update((s) => ({ ...s, connectionStatus: 'connecting', unreachableReason: null }));
    // Pre-flight the public broker so the phone doesn't sit on the ~13s
    // retry-backoff path just to discover the signaling server is down.
    const ok = await checkBrokerReachable();
    brokerReachable.set(ok);
    if (!ok) {
      unreachable('broker-down');
      return;
    }
    try {
      phoneClient = await joinRoom(PEER_PREFIX + joinParam, ownPeerId, {
        onOpen: () => {
          phoneRoom.update((s) => ({ ...s, connectionStatus: 'open', unreachableReason: null }));
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
        onUnreachable: (reason) => unreachable(reason || 'timeout'),
      });
    } catch (err) {
      console.error('phone-join failed', err);
      // joinRoom only throws before the connect attempt (own broker
      // registration failed) — treat it like a signaling-server problem.
      unreachable('broker-down');
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
        // A new guessing phase means the previous reveal is no longer relevant.
        lastReveal: msg.payload.phase === 'guessing' ? null : s.lastReveal,
      }));
    } else if (msg.type === 'reveal') {
      phoneRoom.update((s) => ({
        ...s,
        session: { ...(s.session || {}), phase: 'revealed' },
        lastReveal: msg.payload || null,
      }));
    } else if (msg.type === 'score') {
      phoneRoom.update((s) => ({ ...s, scoreboard: msg.payload.scoreboard || [] }));
    } else if (msg.type === 'end') {
      phoneRoom.update((s) => ({ ...s, session: null }));
    } else if (msg.type === 'control') {
      phoneRoom.update((s) => ({ ...s, isController: !!msg.payload.granted }));
    } else if (msg.type === 'autocountdown') {
      phoneRoom.update((s) => ({
        ...s,
        autoCountdownEndsAt: msg.payload.active ? (msg.payload.endsAt ?? null) : null,
      }));
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

  function onPhoneCommand(e) {
    phoneClient?.send(encode('command', { action: e.detail.action }));
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

  // Dev-mode auto-skip filters. Two independent toggles drive playback skips:
  //   - skipReviewedOk: skip tracks reviewed as 'OK' (issue tags still play)
  //   - skipReviewed:   skip ANY reviewed track (unreviewed only)
  // Both can be on at once — the combined effect equals "unreviewed only".
  // Active only while dev mode is on so normal playback is never silently filtered.
  let lastAutoSkipId = null;
  $: maybeAutoSkip(
    $currentVideo,
    $videoReviews,
    $skipReviewedOk,
    $skipReviewed,
    $devMode,
    $started,
  );
  function maybeAutoSkip(video, reviews, skipOkOn, skipReviewedOn, devOn, started) {
    if (!started || !devOn || !video) return;
    if (!skipOkOn && !skipReviewedOn) return;
    const id = video.video_id;
    if (id === lastAutoSkipId) return; // don't skip the same id twice
    const status = reviews[id]?.status;
    const shouldSkip = (skipOkOn && status === 'OK') || (skipReviewedOn && !!status);
    if (shouldSkip) {
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
  // True when hostRoom() failed — HostRoomView shows an error banner instead
  // of a join code that doesn't exist on the broker.
  let roomError = false;
  // Live broker connection status for the host, surfaced via NetworkBadge so
  // the host can see a drop ('reconnecting'/'unreachable') and know why phones
  // can't join. Updated by hostRoom()'s onBrokerStatus callback.
  let brokerStatus = 'connecting';
  // Solo self-rate state — only meaningful during Solo's 'revealed' phase.

  // Connected-mode host handle (PeerJS room). null when not hosting.
  let host = null;
  const PEER_PREFIX = 'VKTRS-';

  // Remember the user's Song Info preference so we can restore it after a game.
  let priorHintsOn = null;

  async function startConnectedRoom() {
    const code = generateRoomId();
    roomCode = code;
    roomError = false;
    brokerStatus = 'connecting';
    joinUrl = `${globalThis.location.origin}${import.meta.env.BASE_URL}?join=${code}`;
    try {
      host = await hostRoom(PEER_PREFIX + code, {
        onBrokerStatus: (status) => {
          brokerStatus = status;
        },
        onJoin: (peerId) => {
          // Send a welcome snapshot to the joining peer.
          const r = get(room);
          host?.sendTo(
            peerId,
            encode('welcome', {
              sessionState: r.session,
              players: r.players,
              scoreboard: r.players.map(({ id, name, score, isController }) => ({
                id,
                name,
                score,
                isController,
              })),
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
      roomError = true;
    }
  }

  function onPeerMessage(peerId, raw) {
    const msg = parseMessage(raw);
    if (!msg) return;
    const playerId = peerId.replace(/^VKTRS-PEER-/, '');
    if (msg.type === 'join') {
      room.update((s) => addPlayer(s, { id: playerId, name: msg.payload.name || 'Player' }));
      broadcastScore();
      // A controller that dropped and rejoined keeps its role — re-tell the phone.
      if (get(room).players.find((p) => p.id === playerId)?.isController) {
        host?.sendTo(peerId, encode('control', { granted: true }));
      }
    } else if (msg.type === 'guess') {
      const r = get(room);
      if (r.session?.phase === 'guessing') {
        room.update((s) => reduceSubmit(s, playerId, msg.payload.year));
      }
    } else if (msg.type === 'command') {
      const r = get(room);
      const isCtrl = r.players.find((p) => p.id === playerId)?.isController;
      if (!isCtrl) return; // only the delegated controller may drive the game
      const action = msg.payload.action;
      if (action === 'reveal') onReveal();
      else if (action === 'round') {
        if (r.session?.phase === 'idle') onStartRound();
        else if (r.session?.phase === 'revealed') onNextRound();
      } else if (action === 'skip') next();
      else if (action === 'end') onEndSession();
      else if (action === 'cancelCountdown') cancelAutoContinue();
    }
  }

  function onConnectedReveal() {
    const r = get(room);
    const cv = get(currentVideo);
    const actual = cv?.year;
    const winners = closestYearWinners(r.submissions, actual);
    // Exact-match bonus: when the toggle is on AND every winner guessed the
    // exact year (distance 0), award 2 points instead of 1. Non-exact closest
    // guesses keep the standard 1 point. `winners` from closestYearWinners
    // all share the same distance, so checking one is enough — an empty
    // array yields `undefined === actual` which is false for any real year.
    const exact =
      get(exactMatchBonus) && actual != null && r.submissions[winners[0]]?.year === actual;
    const points = exact ? 2 : 1;
    room.update((s) => reduceReveal(s, winners, points));
    host?.broadcast(
      encode('reveal', {
        year: actual,
        title: cv?.title,
        artist: cv?.artist,
        winners,
        submissions: r.submissions,
        points,
      }),
    );
    broadcastScore();
  }

  function broadcastScore() {
    const r = get(room);
    host?.broadcast(
      encode('score', {
        scoreboard: r.players.map(({ id, name, score, isController }) => ({
          id,
          name,
          score,
          isController,
        })),
      }),
    );
  }

  function broadcastRound(phase) {
    const r = get(room);
    host?.broadcast(encode('round', { round: r.session.round, phase }));
  }

  function closeConnectedRoom() {
    host?.close();
    host = null;
  }

  async function onStartMode(e) {
    const mode = e.detail.mode;
    // Connected mode needs the PeerJS broker. If a prior probe (ModeSelector)
    // already came back false, refuse to enter the mode at all so we don't
    // leave gameMode set with no working room. Re-probe when unknown to
    // catch cases where ModeSelector was skipped or the result expired.
    if (mode === 'connected') {
      let ok = get(brokerReachable);
      if (ok === null) {
        ok = await checkBrokerReachable();
        brokerReachable.set(ok);
      }
      if (!ok) return;
    }
    gameMode.set(mode);
    room.update((s) => startSession(s));
    // Hide Song Info during gameplay so the lower third can't spoil the year.
    priorHintsOn = get(hintsOn);
    hintsOn.set(false);
    if (mode === 'connected') startConnectedRoom();
    // Solo HUD starts fresh each session — previous streak/best shouldn't bleed in.
    if (mode === 'solo') resetGuessStats();
  }

  function onStartRound() {
    const cv = get(currentVideo);
    room.update((s) => reduceStartRound(s, cv));
    if (get(gameMode) === 'connected') broadcastRound('guessing');
  }

  function onReveal() {
    onConnectedReveal();
  }

  function onNextRound() {
    room.update((s) => reduceNextRound(s));
    if (get(gameMode) === 'connected') broadcastRound('idle');
    // Advance to the next track so each round plays something new.
    next();
  }

  // ----- Auto-mode (two independent machines) ----------------------------
  // AUTO-START: while a round is idle, poll until a fresh, playable track is
  // actually playing (matched from what the PLAYER reports back to the
  // playlist, which excludes ads for free), then start the round straight to
  // 'guessing'. Covers session start, post-next-round and post-skip. The
  // last-started id guard prevents re-starting the same track if the phase
  // bounces to idle without a track change.
  let autoStartWatch = null;
  let autoStartWaited = 0;
  let lastAutoStartedTrackId = null;
  function clearAutoStart() {
    if (autoStartWatch) clearInterval(autoStartWatch);
    autoStartWatch = null;
    autoStartWaited = 0;
  }
  function autoStartActive() {
    return (
      get(autoStartRound) && get(gameMode) === 'connected' && get(room).session?.phase === 'idle'
    );
  }
  function beginRound(track) {
    if (!track?.video_id) return;
    lastAutoStartedTrackId = track.video_id;
    room.update((s) => reduceStartRound(s, track));
    broadcastRound('guessing');
  }
  $: armAutoStart($autoStartRound, $gameMode, $room.session?.phase);
  function armAutoStart(enabled, mode, phase) {
    if (!(enabled && mode === 'connected' && phase === 'idle')) {
      clearAutoStart();
      return;
    }
    if (autoStartWatch) return; // already armed
    autoStartWaited = 0;
    autoStartWatch = setInterval(() => {
      if (!autoStartActive()) {
        clearAutoStart();
        return;
      }
      autoStartWaited += AUTO_ADVANCE_POLL_MS;
      nudgePlay();
      const playedId = currentPlayerVideoId();
      const fresh =
        playedId && playedId !== lastAutoStartedTrackId
          ? get(playlist).find((t) => t.video_id === playedId)
          : null;
      const timedOut = autoStartWaited >= AUTO_ADVANCE_TRACK_TIMEOUT_MS;
      if (fresh) {
        clearAutoStart();
        beginRound(fresh);
      } else if (timedOut) {
        clearAutoStart();
        beginRound(get(currentVideo));
      }
    }, AUTO_ADVANCE_POLL_MS);
  }

  // AUTO-CONTINUE: once the reveal has been on screen, run a visible,
  // cancellable countdown, then perform "Next round" (advance the track ->
  // idle). If AUTO-START is on it then starts the round; otherwise it waits
  // for a manual / delegated Start. The countdown end time is mirrored to the
  // delegated controller phone via the 'autocountdown' message.
  let autoContinueTimer = null;
  function clearAutoContinue() {
    if (autoContinueTimer) clearTimeout(autoContinueTimer);
    autoContinueTimer = null;
    autoCountdown.set(null);
  }
  function cancelAutoContinue() {
    clearAutoContinue();
    host?.broadcast(encode('autocountdown', { active: false }));
  }
  $: armAutoContinue($autoAdvanceReveal, $gameMode, $room.session?.phase);
  function armAutoContinue(enabled, mode, phase) {
    if (!(enabled && mode === 'connected' && phase === 'revealed')) {
      clearAutoContinue();
      return;
    }
    if (autoContinueTimer) return; // already armed for this reveal
    const endsAt = Date.now() + AUTO_ADVANCE_REVEAL_MS;
    autoCountdown.set({ endsAt });
    host?.broadcast(encode('autocountdown', { active: true, endsAt }));
    autoContinueTimer = setTimeout(() => {
      autoContinueTimer = null;
      autoCountdown.set(null);
      host?.broadcast(encode('autocountdown', { active: false }));
      if (get(room).session?.phase !== 'revealed') return;
      onNextRound();
    }, AUTO_ADVANCE_REVEAL_MS);
  }
  onDestroy(() => {
    clearAutoStart();
    clearAutoContinue();
  });

  // End-game flow is split in two so Connected mode can show a celebration
  // overlay BEFORE the session is torn down. Solo skips the overlay because
  // there's no scoreboard worth celebrating.
  let celebrationOpen = false;
  let celebrationPlayers = [];

  function triggerEndGame() {
    if (get(gameMode) === 'connected') {
      const finalPlayers = get(room).players.map(({ id, name, score }) => ({ id, name, score }));
      host?.broadcast(encode('end', { finalScoreboard: finalPlayers }));
      celebrationPlayers = finalPlayers;
      celebrationOpen = true;
      // Close the GameSheet so the celebration sits unobstructed on the TV.
      gameSheetOpen = false;
    } else {
      finalizeEndGame();
    }
  }

  function finalizeEndGame() {
    if (get(gameMode) === 'connected') {
      closeConnectedRoom();
    }
    room.update((s) => endSession(s));
    gameMode.set(null);
    roomCode = null;
    joinUrl = '';
    roomError = false;
    celebrationOpen = false;
    celebrationPlayers = [];
    // Restore the user's previous Song Info preference.
    if (priorHintsOn !== null) {
      hintsOn.set(priorHintsOn);
      priorHintsOn = null;
    }
  }

  function onEndSession() {
    triggerEndGame();
  }

  function onScoreChange(e) {
    const { playerId, delta } = e.detail;
    room.update((s) => ({
      ...s,
      players: s.players.map((p) =>
        p.id === playerId ? { ...p, score: Math.max(0, (p.score || 0) + delta) } : p,
      ),
    }));
    broadcastScore();
  }

  function onKickPlayer(e) {
    const { playerId } = e.detail;
    const peerId = `${PEER_PREFIX}PEER-${playerId}`;
    // Send the kick notification BEFORE closing the connection.
    host?.sendTo(peerId, encode('kick', { reason: 'Removed by host' }));
    host?.kick(peerId);
    room.update((s) => ({
      ...s,
      players: s.players.filter((p) => p.id !== playerId),
      submissions: Object.fromEntries(
        Object.entries(s.submissions).filter(([id]) => id !== playerId),
      ),
    }));
    broadcastScore();
  }

  function onSetController(e) {
    const { playerId } = e.detail; // string to grant, or null to clear
    const prev = get(room).players.find((p) => p.isController);
    room.update((s) => setController(s, playerId));
    if (prev && prev.id !== playerId) {
      host?.sendTo(`${PEER_PREFIX}PEER-${prev.id}`, encode('control', { granted: false }));
    }
    if (playerId) {
      host?.sendTo(`${PEER_PREFIX}PEER-${playerId}`, encode('control', { granted: true }));
    }
    broadcastScore();
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
  <PhoneShell on:setName={onPhoneSetName} on:guess={onPhoneGuess} on:command={onPhoneCommand} />
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
      {#if $gameMode !== 'connected' || ($room.session?.phase !== 'guessing' && $room.session?.phase !== 'revealed')}
        <LowerThird />
      {/if}
      {#if $gameMode === 'connected' && $room.session?.phase === 'revealed'}
        <RevealOverlay on:nextRound={onNextRound} />
      {/if}
      <AdIndicator />
      <StationLogo />
      <ProgressBar />
      <UpNext />
      {#if $gameMode === 'solo'}
        <GuessGame on:open={() => (gameSheetOpen = true)} />
      {/if}
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

  {#if $gameMode === 'connected' && !gameSheetOpen && !celebrationOpen}
    {#await import('./components/game/FloatingControls.svelte') then m}
      <svelte:component
        this={m.default}
        on:startRound={onStartRound}
        on:reveal={onReveal}
        on:nextRound={onNextRound}
        on:open={() => (gameSheetOpen = true)}
      />
    {/await}
  {/if}

  {#if celebrationOpen}
    {#await import('./components/game/EndGameCelebration.svelte') then m}
      <svelte:component
        this={m.default}
        players={celebrationPlayers}
        on:dismiss={finalizeEndGame}
      />
    {/await}
  {/if}

  {#if gameSheetOpen || $gameMode !== null}
    <LazyGameSheet
      open={gameSheetOpen}
      {roomCode}
      {joinUrl}
      {roomError}
      {brokerStatus}
      on:close={() => (gameSheetOpen = false)}
      on:startMode={onStartMode}
      on:startRound={onStartRound}
      on:reveal={onReveal}
      on:nextRound={onNextRound}
      on:endSession={onEndSession}
      on:scoreChange={onScoreChange}
      on:kick={onKickPlayer}
      on:setController={onSetController}
      on:cancelCountdown={cancelAutoContinue}
    />
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
</style>

<script>
  import { onMount, tick } from 'svelte';
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
    switching,
    crtOn,
    loadError,
    revealNowPlaying,
    currentVideo,
    hintsOn,
    devMode,
    videoReviews,
    skipReviewedOk,
  } from './lib/stores.js';
  import { loadVideos, shuffle, filterVideos } from './lib/data.js';
  import {
    loadYouTubeAPI,
    createPlayer,
    next,
    prev,
    toggle,
    toggleMute,
    armInitWatchdog,
  } from './lib/player.js';
  import { enableWakeLock } from './lib/wakelock.js';
  import { requestAppFullscreen } from './lib/fullscreen.js';
  import { loadFilters } from './lib/channel.js';

  import StartScreen from './components/StartScreen.svelte';
  import CrtOverlay from './components/CrtOverlay.svelte';
  import ChannelStatic from './components/ChannelStatic.svelte';
  import LowerThird from './components/LowerThird.svelte';
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
  import UnmuteHint from './components/UnmuteHint.svelte';
  import ErrorScreen from './components/ErrorScreen.svelte';

  onMount(async () => {
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

  // Keyboard / remote control (desktop). Ignored while typing in form controls.
  function onKey(e) {
    // Escape always closes an open panel, even when a control inside is focused
    if (e.key === 'Escape') {
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
    if ($guideOpen || $queueOpen || $searchOpen || $settingsOpen) return;
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
    }
  }
</script>

<svelte:window on:keydown={onKey} />

<main
  id="tv"
  class:dimmed={$guideOpen || $queueOpen || $searchOpen || $settingsOpen}
  inert={$guideOpen || $queueOpen || $searchOpen || $settingsOpen || !!$loadError || undefined}
  aria-label="Music video channel"
>
  <div id="player"></div>

  {#if $crtOn && $started}
    <CrtOverlay />
  {/if}

  {#if $started}
    <LowerThird />
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

<Guide />
<Queue />
<Search />
<Settings />

{#if !$started && !$loadError}
  <StartScreen on:power={powerOn} />
  <InstallHint />
{/if}

<ErrorScreen />

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

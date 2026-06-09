<!-- src/components/game/LazyGameSheet.svelte -->
<!--
  Lazy wrapper around GameSheet so that the multiplayer code (peerjs,
  protocol, scoring, room/peer wrappers, qrcode) is split into its own
  chunk instead of being bundled into the main entry.

  GameSheet uses a named slot ("solo"), which Svelte cannot forward
  through an `{#await}` + `<svelte:component>` reliably. Keeping the
  await inside this wrapper lets the slot be declared as a normal
  child of `<svelte:component>` at compile time, preserving slot
  semantics.
-->
<script>
  export let open = false;
  export let isPhone = false;
  export let roomCode = null;
  export let joinUrl = '';

  // Start the import as soon as this wrapper is mounted. In TV mode the
  // parent only mounts us when the user has actually opened the game or
  // a session is active; in phone mode we mount immediately.
  const loader = import('./GameSheet.svelte');
</script>

{#await loader then m}
  <svelte:component
    this={m.default}
    {open}
    {isPhone}
    {roomCode}
    {joinUrl}
    on:close
    on:startMode
    on:startRound
    on:reveal
    on:nextRound
    on:endSession
    on:setName
    on:guess
    on:scoreChange
    on:kick
  >
    <svelte:fragment slot="solo">
      <slot name="solo" />
    </svelte:fragment>
  </svelte:component>
{/await}

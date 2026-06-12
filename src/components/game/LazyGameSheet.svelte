<!-- src/components/game/LazyGameSheet.svelte -->
<!--
  Lazy wrapper around GameSheet so that the multiplayer code (peerjs,
  protocol, scoring, room/peer wrappers, qrcode) is split into its own
  chunk instead of being bundled into the main entry.
-->
<script>
  export let open = false;
  export let roomCode = null;
  export let joinUrl = '';
  export let roomError = false;

  // Start the import as soon as this wrapper is mounted. The parent only
  // mounts us when the user has actually opened the game or a session is
  // active. (Phone mode renders PhoneShell directly, never this sheet.)
  const loader = import('./GameSheet.svelte');
</script>

{#await loader then m}
  <svelte:component
    this={m.default}
    {open}
    {roomCode}
    {joinUrl}
    {roomError}
    on:close
    on:startMode
    on:startRound
    on:reveal
    on:nextRound
    on:endSession
    on:scoreChange
    on:kick
  />
{/await}

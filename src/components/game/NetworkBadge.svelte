<!-- src/components/game/NetworkBadge.svelte -->
<script>
  export let status = 'idle'; // 'idle'|'connecting'|'open'|'reconnecting'|'unreachable'
  const labels = {
    idle: 'Idle',
    connecting: 'Connecting…',
    open: 'Connected',
    reconnecting: 'Reconnecting…',
    unreachable: 'Disconnected',
  };
</script>

<span class="badge {status}">● {labels[status]}</span>

<style>
  .badge {
    font-size: 0.85em;
    padding: 2px 6px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
  }
  .badge.open {
    color: #6f6;
  }
  .badge.reconnecting {
    color: #fc6;
  }
  .badge.unreachable {
    color: #f88;
  }
</style>

<!-- src/components/game/NetworkBadge.svelte -->
<script>
  export let status = 'idle'; // 'idle'|'connecting'|'open'|'reconnecting'|'unreachable'
  const labels = {
    idle: 'IDLE',
    connecting: 'CONNECTING',
    open: 'CONNECTED',
    reconnecting: 'RECONNECTING',
    unreachable: 'OFFLINE',
  };
</script>

<span class="badge {status}">
  <span class="dot" aria-hidden="true"></span>
  <span class="label">{labels[status]}</span>
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 4px 10px;
    font-family: 'VT323', monospace;
    font-size: 16px;
    letter-spacing: 2px;
    color: #050505;
    background: rgba(255, 255, 255, 0.6);
    border: 2px solid #050505;
    text-transform: uppercase;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #050505;
  }
  .badge.open {
    background: var(--accent-2);
  }
  .badge.connecting,
  .badge.reconnecting {
    background: var(--bug-yellow);
  }
  .badge.unreachable {
    background: var(--accent);
    color: #050505;
  }
  .badge.connecting .dot,
  .badge.reconnecting .dot {
    animation: blink 0.9s steps(2, end) infinite;
  }
  @keyframes blink {
    50% {
      opacity: 0.2;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .badge.connecting .dot,
    .badge.reconnecting .dot {
      animation: none;
    }
  }
</style>

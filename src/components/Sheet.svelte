<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { trapFocus } from '../lib/a11y.js';

  export let open = false;
  export let label; // aria-label (accessible name)
  export let heading = ''; // visible title; override with the "title" slot
  export let accent = 'var(--accent)'; // top border colour
  // When set (non-empty), render a back arrow next to the close button that
  // dispatches a `back` event. Consumers wire that to re-open whichever sheet
  // navigated here (typically the TV Guide). Pass an accessible aria-label.
  export let backLabel = '';

  const dispatch = createEventDispatcher();
  const close = () => dispatch('close');
  const back = () => dispatch('back');

  // CSS slide-up needs a prior frame at translateY(110%) for the transition
  // to interpolate from. Permanently-mounted sheets get that for free (they
  // start closed, then `open` flips true). Lazy-mounted sheets (e.g.
  // LazyGameSheet behind an {#if}) would otherwise render directly at the
  // open state and skip the animation. Defer the open class by one rAF so
  // the closed state commits first.
  let mounted = false;
  onMount(() => {
    requestAnimationFrame(() => {
      mounted = true;
    });
  });
  $: visibleOpen = mounted && open;
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="sheet-root" class:open={visibleOpen} inert={!visibleOpen || undefined} on:click={close}>
  <div
    class="sheet"
    role="dialog"
    aria-modal="true"
    aria-label={label}
    tabindex="-1"
    style="--sheet-accent: {accent}"
    use:trapFocus={open}
    on:click|stopPropagation
  >
    <div class="sheet-head">
      <slot name="title">{heading}</slot>
      <div class="sheet-actions">
        <slot name="actions" />
        {#if backLabel}
          <button class="icon-btn" type="button" aria-label={backLabel} on:click={back}>
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <polyline points="15 6 9 12 15 18" />
            </svg>
          </button>
        {/if}
        <button class="icon-btn" type="button" aria-label="Close" on:click={close}>&#x2715;</button>
      </div>
    </div>
    <slot />
  </div>
</div>

<style>
  .sheet-root {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    pointer-events: none;
  }
  .sheet-root.open {
    pointer-events: auto;
  }
  .sheet {
    width: min(760px, 100%);
    max-height: 82vh;
    overflow-y: auto;
    background: rgba(8, 8, 12, 0.88);
    backdrop-filter: blur(14px);
    border-top: 3px solid var(--sheet-accent, var(--accent));
    padding: 22px clamp(18px, 5vw, 46px) calc(34px + env(safe-area-inset-bottom));
    transform: translateY(110%);
    transition: transform var(--dur-panel) cubic-bezier(0.2, 0.9, 0.25, 1);
  }
  .sheet-root.open .sheet {
    transform: translateY(0);
  }
  /* Sheet header layout: 3-column grid — wordmark left, subheading centered,
     actions right. Each sheet's title slot provides two children (wordmark,
     subheading); together with .sheet-actions they fill the three columns. */
  .sheet-head {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 16px;
    margin-bottom: 22px;
    min-height: 38px;
  }
  .sheet-head > :first-child {
    justify-self: start;
  }
  .sheet-actions {
    justify-self: end;
    display: flex;
    gap: 10px;
  }
</style>

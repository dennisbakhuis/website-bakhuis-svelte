<script lang="ts">
  import MapGlyph from '$lib/components/dive/MapGlyph.svelte';
  import { OBJECT_KINDS, type ObjectKind } from '$lib/dive/sitemap';

  let {
    value,
    onchange,
    compact = false,
  }: {
    value: ObjectKind;
    onchange: (kind: ObjectKind) => void;
    /** Icons only, with the name as a tooltip; for narrow panels. */
    compact?: boolean;
  } = $props();
</script>

<div class="picker" class:compact role="radiogroup" aria-label="Object">
  {#each OBJECT_KINDS as o (o.kind)}
    <button
      type="button"
      role="radio"
      aria-checked={value === o.kind}
      class:selected={value === o.kind}
      title={o.label}
      onclick={() => onchange(o.kind)}
    >
      <svg viewBox="-16 -16 32 32" aria-hidden="true"
        ><MapGlyph type="object" objectKind={o.kind} /></svg
      >
      {#if !compact}<span>{o.label}</span>{/if}
    </button>
  {/each}
</div>

<style>
  .picker {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  button {
    --map-bg: var(--color-bg-elevated);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    width: 64px;
    padding: 5px 2px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-bg-elevated);
    color: var(--color-text-muted);
    font-size: 10px;
    line-height: 1.1;
    cursor: pointer;
  }
  .compact button {
    width: 36px;
    padding: 4px;
  }
  button:hover {
    border-color: var(--color-border-strong);
    color: var(--color-text);
  }
  button.selected {
    border-color: var(--color-accent);
    color: var(--color-text);
    box-shadow: 0 0 0 1px var(--color-accent);
  }
  svg {
    width: 28px;
    height: 28px;
    overflow: visible;
  }
  .compact svg {
    width: 24px;
    height: 24px;
  }
  span {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>

<script lang="ts">
  import type { Snapshot } from './$types';
  import DivePage from '$lib/divelog/routes/DivePage.svelte';
  import type { PageSnapshot } from '$lib/divelog/routes/snapshot';

  let { data } = $props();

  let page = $state<{ snapshot: Snapshot<PageSnapshot> }>();

  export const snapshot: Snapshot<PageSnapshot> = {
    capture: () => page?.snapshot.capture() ?? null,
    restore: (saved) => page?.snapshot.restore(saved),
  };
</script>

<DivePage bind:this={page} {data} />

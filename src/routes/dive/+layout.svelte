<script lang="ts">
  import DiveNav from '$lib/components/dive/DiveNav.svelte';
  import DivelogProvider from '$lib/components/dive/DivelogProvider.svelte';
  import { divelogConfig } from '$lib/divelog-config';

  let { children } = $props();
</script>

<DivelogProvider config={divelogConfig}>
  <DiveNav />
  {@render children()}
</DivelogProvider>

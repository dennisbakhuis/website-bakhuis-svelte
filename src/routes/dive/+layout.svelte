<script lang="ts">
  import { DiveNav, DivelogProvider } from '@divelog/kit';
  import { divelogConfig } from '$lib/divelog-config';

  let { children } = $props();
</script>

<DivelogProvider config={divelogConfig} skipLink={false}>
  <DiveNav />
  {@render children()}
</DivelogProvider>

<script lang="ts">
  import DiveNav from '$lib/components/dive/DiveNav.svelte';

  let { children } = $props();
</script>

<DiveNav />
{@render children()}

<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { DivelogConfig } from '$lib/dive/config';
  import { setDivelog } from '$lib/dive/context';
  import { configureAdminClient } from '$lib/admin/client';

  let { config, children }: { config: DivelogConfig; children: Snippet } = $props();

  // svelte-ignore state_referenced_locally
  setDivelog(config);
  // svelte-ignore state_referenced_locally
  configureAdminClient(config.apiBase);
</script>

{@render children()}

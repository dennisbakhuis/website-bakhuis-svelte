<script lang="ts">
  import DivelogProvider from '$lib/components/dive/DivelogProvider.svelte';
  import AdminShell from '$lib/divelog/routes/admin/AdminShell.svelte';
  import { divelogConfig } from '$lib/divelog-config';

  let { children, data } = $props();
</script>

<DivelogProvider config={divelogConfig}>
  <AdminShell owner={data.owner}>
    {@render children()}
  </AdminShell>
</DivelogProvider>

<script lang="ts">
  import { DivelogProvider } from '@divelog/kit';
  import { AdminShell } from '@divelog/kit/routes';
  import { divelogConfig } from '$lib/divelog-config';

  let { children, data } = $props();
</script>

<DivelogProvider config={divelogConfig} skipLink={false}>
  <AdminShell owner={data.owner}>
    {@render children()}
  </AdminShell>
</DivelogProvider>

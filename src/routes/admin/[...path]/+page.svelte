<script lang="ts">
  import AdminPage from '$lib/divelog/routes/AdminPage.svelte';

  let { data } = $props();
</script>

<AdminPage {data} />

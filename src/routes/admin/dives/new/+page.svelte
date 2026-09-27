<script lang="ts">
  import DiveForm from '$lib/components/admin/DiveForm.svelte';

  let { data } = $props();
</script>

<h1>New dive</h1>
<DiveForm
  dive={null}
  nextNumber={data.nextNumber}
  sites={data.sites}
  trips={data.trips}
  people={data.people}
  setups={data.setups}
/>

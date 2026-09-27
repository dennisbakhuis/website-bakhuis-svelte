<script lang="ts">
  import DiveForm from '$lib/components/admin/DiveForm.svelte';
  import Attachments from '$lib/components/admin/Attachments.svelte';

  let { data } = $props();
</script>

<h1>
  Dive #{data.dive.number}
  <a class="view" href="/dive/{data.dive.number}" target="_blank" rel="noopener">view →</a>
</h1>
<DiveForm
  dive={data.dive}
  nextNumber={data.dive.number}
  sites={data.sites}
  trips={data.trips}
  people={data.people}
  setups={data.setups}
/>
<Attachments dive={data.dive} />

<style>
  .view {
    font-size: 14px;
    font-weight: 400;
    margin-left: 10px;
  }
</style>

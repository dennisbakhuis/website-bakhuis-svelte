<script lang="ts">
  import ContactForm from '$lib/components/ContactForm.svelte';
  import { site } from '$lib/site';
  import { goHref } from '$lib/go-targets';

  let { data } = $props();
</script>

<section class="page container">
  <div class="intro">
    <p class="kicker">Contact</p>
    <h1>Say hello</h1>
    <p class="lede">
      Projects, talks, a question about something I wrote, or a dive trip that needs one more diver
      — all welcome. I usually answer within a day or two.
    </p>
    <ul class="methods">
      <li><a href={goHref('email', 'contact')} data-sveltekit-reload>{site.email}</a></li>
      <li><a href={goHref('linkedin', 'contact')} data-sveltekit-reload>LinkedIn</a></li>
      <li><a href={goHref('github', 'contact')} data-sveltekit-reload>GitHub</a></li>
    </ul>
  </div>
  <div class="card form-card">
    <ContactForm data={data.form} />
  </div>
</section>

<style>
  .page {
    padding-top: 64px;
    padding-bottom: var(--space-section);
    display: grid;
    gap: 48px;
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    align-items: start;
  }
  h1 {
    font-size: clamp(34px, 5vw, 52px);
  }
  .lede {
    color: var(--color-text-muted);
    font-size: 1.1rem;
    max-width: 44ch;
  }
  .methods {
    list-style: none;
    padding: 0;
    margin: 24px 0 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .form-card {
    padding: 28px;
  }
  @media (max-width: 800px) {
    .page {
      grid-template-columns: 1fr;
      gap: 28px;
    }
  }
</style>

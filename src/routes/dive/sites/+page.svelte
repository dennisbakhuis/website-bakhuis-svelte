<script lang="ts">
  import { flagEmoji, formatDepth, pluralize } from '$lib/dive/format';
  import { reveal } from '$lib/anim/reveal';

  let { data } = $props();
</script>

<section class="page container">
  <p class="kicker">Dive sites</p>
  <h1>{data.total} places, <span class="accent">{data.countries.length} countries</span></h1>
  <p class="lede">
    Every site in the log. Cave sites carry a stick map of the line where I have drawn one, and some
    have a scanned map or a photo of the entrance.
  </p>

  {#each data.countries as group (group.country)}
    <section class="country" use:reveal={{ stagger: 40 }}>
      <h2 data-reveal>{flagEmoji(group.code)} {group.country}</h2>
      <ul class="sites">
        {#each group.sites as site (site.slug)}
          <li data-reveal>
            <a class="site card" href="/dive/sites/{site.slug}">
              <span class="site-name">{site.name}</span>
              <span class="site-meta">
                <span class="type">{site.site_type}</span>
                {#if site.region}<span>· {site.region}</span>{/if}
                {#if site.max_depth_m}<span class="num">· {formatDepth(site.max_depth_m)}</span
                  >{/if}
              </span>
              <span class="site-foot">
                <span class="num">{pluralize(site.dive_count, 'dive')}</span>
                {#if site.has_map}<span class="badge">map</span>{/if}
              </span>
            </a>
          </li>
        {/each}
      </ul>
    </section>
  {/each}
</section>

<style>
  .page {
    padding-top: 56px;
    padding-bottom: var(--space-section);
  }
  h1 {
    font-size: clamp(34px, 5vw, 52px);
  }
  .accent {
    color: var(--color-accent);
  }
  .lede {
    color: var(--color-text-muted);
    font-size: 1.1rem;
    max-width: 56ch;
    margin-bottom: 36px;
  }
  .country {
    margin-bottom: 36px;
  }
  .country h2 {
    font-size: 22px;
    margin-bottom: 14px;
  }
  .sites {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
  .site {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 16px;
    text-decoration: none;
    color: inherit;
    height: 100%;
    transition:
      transform 0.15s ease,
      border-color 0.15s ease;
  }
  .site:hover {
    transform: translateY(-2px);
    border-color: var(--color-accent);
  }
  .site-name {
    font-family: var(--font-display);
    font-size: 17px;
    font-weight: 600;
  }
  .site-meta {
    font-size: 13px;
    color: var(--color-text-muted);
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
  .type {
    text-transform: capitalize;
  }
  .site-foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
    padding-top: 8px;
    font-size: 13px;
    color: var(--color-text-faint);
  }
  .badge {
    font-family: var(--font-mono);
    font-size: 10.5px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--color-accent-soft);
    color: var(--color-accent);
  }
</style>

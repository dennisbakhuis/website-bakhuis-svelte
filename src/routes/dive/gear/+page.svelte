<script lang="ts">
  import Markdown from '$lib/components/Markdown.svelte';
  import { formatDate, pluralize } from '$lib/dive/format';
  import { reveal } from '$lib/anim/reveal';

  let { data } = $props();
  const current = $derived(data.gear.items.filter((i) => !i.retired));
  const retired = $derived(data.gear.items.filter((i) => i.retired));

  const categories = $derived(
    [...new Set(current.map((i) => i.category))].map((category) => ({
      category,
      items: current.filter((i) => i.category === category),
    })),
  );
</script>

<section class="page container">
  <a class="back" href="/dive">← Dive log</a>
  <p class="kicker">Gear</p>
  <h1>What I dive with</h1>
  <p class="lede">
    Setups are the combinations I actually dive; items are the pieces. Each shows how many logged
    dives it has been on.
  </p>

  <div class="setups" use:reveal={{ stagger: 90 }}>
    {#each data.gear.setups as setup (setup.id)}
      <article class="card setup" id={setup.slug} data-reveal>
        <header>
          <h2>{setup.name}</h2>
          <a class="count num" href="/dive?setup={setup.slug}"
            >{pluralize(setup.dive_count, 'dive')} →</a
          >
        </header>
        {#if setup.description_md}<Markdown source={setup.description_md} />{/if}
        <ul class="setup-items">
          {#each setup.items as item (item.id)}
            <li>
              <a href="#item-{item.id}">{item.name}</a><span class="muted">
                · {item.brand} {item.model}</span
              >
            </li>
          {/each}
        </ul>
      </article>
    {/each}
  </div>

  <h2 class="section-title">Items</h2>
  {#each categories as group (group.category)}
    <section class="category" use:reveal={{ stagger: 60 }}>
      <h3>{group.category}</h3>
      <div class="items">
        {#each group.items as item (item.id)}
          <article class="card item" id="item-{item.id}" data-reveal>
            {#if item.photo_url}
              <img src={item.photo_url} alt={item.name} loading="lazy" />
            {/if}
            <div class="item-body">
              <h4>{item.name}</h4>
              <p class="muted">{item.brand} {item.model}</p>
              <p class="facts num">
                {#if item.acquired}since {formatDate(item.acquired)} ·
                {/if}{pluralize(item.dive_count, 'dive')}
              </p>
              {#if item.notes_md}<Markdown source={item.notes_md} />{/if}
            </div>
          </article>
        {/each}
      </div>
    </section>
  {/each}

  {#if retired.length}
    <section class="category retired">
      <h3>Past gear</h3>
      <ul>
        {#each retired as item (item.id)}
          <li>
            <strong>{item.name}</strong>
            <span class="muted"
              >{item.brand}
              {item.model} · {formatDate(item.acquired)} – {formatDate(item.retired)} · {pluralize(
                item.dive_count,
                'dive',
              )}</span
            >
          </li>
        {/each}
      </ul>
    </section>
  {/if}
</section>

<style>
  .page {
    padding-top: 40px;
    padding-bottom: var(--space-section);
  }
  .back {
    text-decoration: none;
    color: var(--color-text-muted);
    font-size: 14px;
    display: inline-block;
    margin-bottom: 24px;
  }
  h1 {
    font-size: clamp(34px, 5vw, 52px);
  }
  .lede {
    color: var(--color-text-muted);
    font-size: 1.1rem;
    max-width: 52ch;
    margin-bottom: 32px;
  }
  .setups {
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    margin-bottom: 56px;
  }
  .setup {
    padding: 22px;
    background: var(--color-bg-elevated);
  }
  .setup header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 8px;
  }
  .setup h2 {
    font-size: 21px;
    margin: 0;
  }
  .count {
    font-size: 13px;
    text-decoration: none;
    white-space: nowrap;
  }
  .setup-items {
    list-style: none;
    padding: 0;
    margin: 8px 0 0;
    font-size: 14.5px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .setup-items a {
    text-decoration: none;
    color: var(--color-text);
  }
  .setup-items a:hover {
    color: var(--color-accent);
  }
  .section-title {
    font-size: 26px;
  }
  .category {
    margin-top: 28px;
  }
  .category h3 {
    font-family: var(--font-mono);
    font-size: 12px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    margin-bottom: 12px;
  }
  .items {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
  .item {
    overflow: hidden;
  }
  .item img {
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
  }
  .item-body {
    padding: 16px;
  }
  .item h4 {
    font-size: 17px;
    margin-bottom: 2px;
  }
  .muted {
    color: var(--color-text-muted);
    font-size: 14px;
  }
  .facts {
    font-size: 12.5px;
    color: var(--color-text-faint);
  }
  .retired ul {
    padding-left: 18px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
</style>

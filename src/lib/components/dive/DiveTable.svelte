<script lang="ts">
  import type { DiveListItem } from '$lib/dive/types';
  import { flagEmoji, formatDate, formatDepth, formatTemp } from '$lib/dive/format';

  let { dives }: { dives: DiveListItem[] } = $props();
</script>

{#if dives.length === 0}
  <p class="empty">No dives match — loosen a filter or two.</p>
{:else}
  <ol class="dives" reversed>
    {#each dives as dive (dive.number)}
      <li>
        <a class="dive" href="/dive/{dive.number}">
          <span class="cover" class:has-photo={dive.cover_url}>
            {#if dive.cover_url}
              <img src={dive.cover_url} alt="" loading="lazy" width="120" height="80" />
            {:else}
              <span class="num">#{dive.number}</span>
            {/if}
          </span>
          <span class="main">
            <span class="title">
              <span class="number num">#{dive.number}</span>
              {dive.title || dive.site?.name || 'Untitled dive'}
            </span>
            <span class="where">
              {#if dive.site}
                {flagEmoji(dive.site.country_code)}
                {dive.site.name}{dive.site.region ? `, ${dive.site.region}` : ''}
              {:else}
                Unknown site
              {/if}
              {#if dive.buddies.length}
                · with {dive.buddies.join(', ')}
              {/if}
            </span>
            <span class="tags">
              {#each dive.tags as tag (tag)}<span class="tag" data-tag={tag}>{tag}</span>{/each}
            </span>
          </span>
          <span class="numbers num">
            <span><small>date</small>{formatDate(dive.date)}</span>
            <span><small>depth</small>{formatDepth(dive.max_depth_m)}</span>
            <span><small>time</small>{dive.duration_min} min</span>
            <span><small>water</small>{formatTemp(dive.water_temp_c)}</span>
          </span>
        </a>
      </li>
    {/each}
  </ol>
{/if}

<style>
  .empty {
    color: var(--color-text-muted);
    padding: 40px 0;
  }
  .dives {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .dive {
    display: grid;
    grid-template-columns: 96px 1fr auto;
    gap: 16px;
    align-items: center;
    padding: 12px 16px 12px 12px;
    border-radius: var(--radius);
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    text-decoration: none;
    color: inherit;
    transition:
      border-color 0.15s ease,
      transform 0.15s ease;
  }
  .dive:hover {
    border-color: var(--color-accent);
    transform: translateX(2px);
  }
  .cover {
    width: 96px;
    height: 64px;
    border-radius: var(--radius-sm);
    background: var(--color-surface-2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-faint);
    font-size: 13px;
    overflow: hidden;
  }
  .cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .main {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .title {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 17px;
    display: flex;
    gap: 10px;
    align-items: baseline;
  }
  .number {
    font-size: 12px;
    color: var(--color-text-faint);
    font-weight: 400;
  }
  .where {
    color: var(--color-text-muted);
    font-size: 14px;
  }
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .numbers {
    display: grid;
    grid-template-columns: repeat(4, auto);
    gap: 18px;
    font-size: 14px;
    text-align: right;
  }
  .numbers span {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
  .numbers small {
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-text-faint);
  }
  @media (max-width: 820px) {
    .dive {
      grid-template-columns: 72px 1fr;
    }
    .cover {
      width: 72px;
      height: 48px;
    }
    .numbers {
      grid-column: 1 / -1;
      grid-template-columns: repeat(4, 1fr);
      text-align: left;
      gap: 8px;
    }
    .numbers span {
      align-items: flex-start;
    }
  }
</style>

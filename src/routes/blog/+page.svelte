<script lang="ts">
  import { BlogListPage } from '@blog/kit';
  import { blogConfig, blogUrls } from '$lib/blog-config';

  let { data } = $props();
</script>

<!-- prettier-ignore -->
<BlogListPage {data} config={blogConfig} urls={blogUrls}>
  {#snippet lede()}Longer articles on Python, machine learning, data engineering and diving, mixed with short <abbr title="Today I learned">TIL</abbr> notes: one command, one gotcha, one thing that cost an hour.{/snippet}
</BlogListPage>

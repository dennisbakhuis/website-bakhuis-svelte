<script lang="ts">
  import { BlogListPage } from '@blog/kit';
  import { blogConfig, blogUrls } from '$lib/blog-config';

  let { data } = $props();
</script>

<BlogListPage {data} config={blogConfig} urls={blogUrls} />

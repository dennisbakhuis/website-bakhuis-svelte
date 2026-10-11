<script lang="ts">
  import { BlogPostPage } from '@blog/kit';
  import { blogConfig, blogUrls } from '$lib/blog-config';

  let { data } = $props();
</script>

<BlogPostPage
  post={data.post}
  config={blogConfig}
  urls={blogUrls}
  tagHref={(tag, backHref) => `${backHref}?tag=${tag}`}
/>

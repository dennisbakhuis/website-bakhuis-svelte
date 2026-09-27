<script lang="ts">
  import PostPage from '$lib/components/PostPage.svelte';

  let { data } = $props();
</script>

<PostPage
  post={data.post}
  backHref={data.post.kind === 'til' ? '/blog?kind=til' : '/blog'}
  backLabel={data.post.kind === 'til' ? 'All TIL notes' : 'All writing'}
/>

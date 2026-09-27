---
title: Svelte actions should return a destroy function
date: 2026-08-14
tags: [svelte]
summary: An IntersectionObserver created in an action outlives the element unless the action returns `{ destroy }`.
words: 90
---

```ts
export const reveal: Action<HTMLElement> = (node) => {
  const observer = new IntersectionObserver(/* … */);
  observer.observe(node);
  return { destroy: () => observer.disconnect() };
};
```

Without the `destroy`, client-side navigation leaves observers attached to
detached nodes. Harmless at first, a leak after fifty page views.

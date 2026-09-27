---
title: JSONB containment beats LIKE for tag columns
date: 2026-08-21
tags: [postgres, sql]
summary: Store tags as a JSONB array and query with `@>` — it uses the GIN index and reads like what it means.
words: 110
---

```sql
select number, tags
from dives
where tags @> '["cave", "scooter"]'::jsonb;
```

`@>` means "contains". With `create index on dives using gin (tags)` this is an
index scan. The equivalent `tags::text like '%cave%'` matches `cavern` too and
never uses an index.

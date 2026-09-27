---
title: Why I log every dive (and built a website to do it)
date: 2026-08-30
tags: [diving, data, meta]
summary: A paper logbook is a nice object. A database is a better one. On turning fifteen years of scribbles into something you can query.
words: 780
---

I have kept a paper logbook since my very first open-water dive. Ink, stamps, a
buddy's signature, the occasional smear of salt water. It is a lovely object and
I would grab it in a fire.

It is also almost useless as _data_.

## The questions a logbook can't answer

How many hours have I spent underwater? Which was my coldest dive? How many of
my cave dives were on a scooter, and did the average depth of those change once
I switched to sidemount? Every one of these is a five-second query against a
table and a twenty-minute flip through pages — and I only ever did the
twenty-minute version once.

So the log lives in a database now. Every dive is a row: number, date, site,
depth, time, gas, tags, buddies, the profile from the computer, the photos, and
a scan of the paper page it came from. The paper book stays the source of the
story; the database is the source of the numbers.

## What "every dive" means

Every dive. The training dives at 12 metres in a quarry. The one where the
visibility was 50 cm and we called it after nine minutes. The ones nobody would
put on Instagram. The point of a log is that it is complete; the statistics on
[the dive page](/dive) are only honest because the boring dives are in there
too.

## Why a website

Because a spreadsheet is where data goes to be forgotten. Putting the log on a
page with a map and a search box means I actually look at it, and because the
page is public I keep it tidy. A private dive can stay private — it still counts
in the totals, it just doesn't show up in the list.

```python
def hours_underwater(dives: list[Dive]) -> float:
    return sum(d.duration_min for d in dives) / 60
```

That's the whole business logic. Everything else is plumbing, and plumbing is
the fun part.

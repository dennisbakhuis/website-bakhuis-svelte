---
title: uv can run a script with inline dependencies
date: 2026-09-02
tags: [python, uv]
summary: PEP 723 metadata at the top of a script and `uv run script.py` does the rest — no venv, no requirements file.
words: 120
---

Put this at the top of a script:

```python
# /// script
# requires-python = ">=3.13"
# dependencies = ["httpx", "rich"]
# ///
```

Then `uv run script.py`. uv resolves and caches the dependencies in an isolated
environment on first run. Perfect for one-off tools that live in a repo without
becoming part of the project.

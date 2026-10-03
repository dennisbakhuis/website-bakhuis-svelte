# dennisbakhuis.nl

Personal website of Dennis Bakhuis: profile, online dive log, blog and TIL.
SvelteKit frontend + FastAPI backend, same conventions as the other Dinkellabs
sites. The design contract lives in [docs/SPEC.md](docs/SPEC.md).

```fish
make install   # pnpm install + uv sync
make run       # Backend + Mailpit in Docker, SvelteKit dev server on :5373
```

| URL                            | What                                         |
| ------------------------------ | -------------------------------------------- |
| http://localhost:5373          | The site (front page, /dive, /blog, /admin)  |
| http://localhost:8300/api/docs | FastAPI docs (DEBUG only)                    |
| http://localhost:8325          | Mailpit — magic-link sign-in mails land here |

The dive log is a directory of Markdown and JSON files — the private
`divelog-data` repository, checked out next to this one (`DATA_REPO` in
`.env`) and mounted into the backend. Sign in at `/admin/login` with the
`OWNER_EMAIL` from `.env`, open the link in Mailpit.

## Stack

| Layer     | Technology                                                             |
| --------- | ---------------------------------------------------------------------- |
| Frontend  | SvelteKit 2 + Svelte 5 (runes), TypeScript, adapter-node               |
| Backend   | Python 3.13, FastAPI, Pydantic, Pillow, lxml                           |
| Data      | Files in the private `divelog-data` git repo, loaded into memory       |
| Media     | Local files in dev (`MEDIA_ROOT`), S3 (Hetzner Object Storage) in prod |
| Auth      | Owner-only magic link → session cookie                                 |
| Content   | Markdown via mdsvex (`src/content/{blog,til}`), Shiki highlighting     |
| Animation | anime.js v4 (front page "Descent", reveals, counters, profile)         |
| Map       | Natural Earth TopoJSON projected server-side with d3-geo, no tiles     |
| Tests     | Vitest (frontend), pytest (backend, on a fixture data tree)            |
| Deploy    | Two Docker images on GHCR, Caddy on `operator-infra`                 |

## Common commands

| Command                 | Purpose                      |
| ----------------------- | ---------------------------- |
| `make run`              | Everything for local dev     |
| `make up` / `make down` | Just the Docker services     |
| `make data-pull`        | Pull divelog-data and reload |
| `make data-status`      | Status of the data checkout  |
| `make check`            | svelte-check                 |
| `make lint`             | ESLint (zero warnings)       |
| `make test`             | Vitest                       |
| `make backend-check`    | ruff + mypy strict + pytest  |
| `make ci`               | Everything CI runs           |
| `make build`            | Production frontend build    |
| `make docker-build`     | Both production images       |

## Project structure

```
backend/
  app/api/v1/       public (dive), auth, admin, media routers
  app/store/        the data repository in memory: records, loader, git write-back
  app/services/     auth, storage (local/S3), image variants, stats
  app/importers/    Subsurface XML parser
  tests/            pytest on tests/fixtures/data, a tiny data tree
src/
  content/          blog + TIL markdown
  lib/anim/         anime.js helpers (descent, reveal, counter)
  lib/dive/         types, formatting, client-side filter, stats view
  lib/map/          world outline projection
  lib/components/   home/, dive/, admin/, shared
  lib/server/       backend API client, cap, e-mail, rate limiter, umami
  routes/           /, dive/, blog/, til/ (redirects), contact, admin/, feed.xml, …
docs/SPEC.md        the spec
```

## Adding content

- **Blog post**: `src/content/blog/<slug>.md` with frontmatter
  `title, date, tags, summary, words` (optional `updated`, `draft`, `external`).
- **TIL**: same in `src/content/til/`. TIL notes show up in `/blog` as a filter (`?kind=til`); `/til` redirects there.
- **Dives**: through `/admin` — form, photos, logbook scans, or a Subsurface
  import that creates drafts.

## Versioning & deploy

`VERSION` is the single source of truth; `pnpm version:sync` keeps
`package.json` in step and CI fails on drift. Branch flow: feature → `dev`
(auto-deploys to dev.dennisbakhuis.nl) → PR to `main` (must bump `VERSION`).
`docker-publish.yml` builds the frontend and backend images.

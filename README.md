# dennisbakhuis.nl

Personal website of Dennis Bakhuis: profile, online dive log, blog and TIL.
SvelteKit frontend, same conventions as the other Dinkellabs sites. The dive
log is the divelog module: `@divelog/kit` (vendored in `vendor/`) for the pages
and `divelog-server` for the backend, both from the divelog monorepo checked out
next to this one (`../divelog`). The design contract lives in
[docs/SPEC.md](docs/SPEC.md); how the pieces fit in [docs/RUNBOOK.md](docs/RUNBOOK.md).

```fish
make install   # pnpm install + uv sync (site tools on the server package)
make run       # divelog-server + Mailpit in Docker, SvelteKit dev server on :5373
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

| Layer     | Technology                                                                     |
| --------- | ------------------------------------------------------------------------------ |
| Frontend  | SvelteKit 2 + Svelte 5 (runes), TypeScript, adapter-node                       |
| Dive log  | `@divelog/kit` (packed tarball in `vendor/`, `make kit-vendor`)                |
| Backend   | `divelog-server` (Python 3.13, FastAPI) from `../divelog/packages/server`      |
| Data      | Files in the private `divelog-data` git repo, loaded into memory               |
| Media     | Local files in dev (`MEDIA_ROOT`), S3 (Hetzner Object Storage) in prod         |
| Auth      | Owner-only magic link → session cookie                                         |
| Content   | Markdown via mdsvex (`src/content/{blog,til}`), Shiki highlighting             |
| Animation | anime.js v4 (front page "Descent", reveals, counters, profile)                 |
| Map       | MapLibre on self-hosted PMTiles (in the kit)                                   |
| Tests     | Vitest here; the kit and the server are tested in the monorepo                 |
| Deploy    | Frontend image from here + `divelog-server` image, Caddy on `operator-infra` |

## Common commands

| Command                 | Purpose                         |
| ----------------------- | ------------------------------- |
| `make run`              | Everything for local dev        |
| `make up` / `make down` | Just the Docker services        |
| `make data-pull`        | Pull divelog-data and reload    |
| `make data-status`      | Status of the data checkout     |
| `make check`            | svelte-check                    |
| `make lint`             | ESLint (zero warnings)          |
| `make test`             | Vitest                          |
| `make kit-vendor`       | Re-pack the kit from ../divelog |
| `make kit-check`        | Vendored kit = monorepo kit     |
| `make ci`               | Everything CI runs              |
| `make build`            | Production frontend build       |
| `make docker-build`     | Frontend production image       |

## Project structure

```
src/
  content/          blog + TIL markdown
  lib/divelog-config.ts  the dive log's personal config (names, URL, copy)
  lib/anim/         anime.js helpers (descent, fish)
  lib/components/   home/, contact form, post list/page
  lib/server/       cap, e-mail, rate limiter, umami
  routes/           /, dive/ + admin/ (kit catch-alls), blog/, til/ (redirects), contact, feed.xml, …
vendor/             @divelog/kit tarball
scripts/            personal data one-offs (uv project, imports divelog_server)
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
`docker-publish.yml` builds the frontend image; the deploy runs it next to
`ghcr.io/<owner>/divelog-server:<DIVELOG_SERVER_TAG>` (default `latest`).

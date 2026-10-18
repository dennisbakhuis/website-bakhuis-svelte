# dennisbakhuis.nl

Personal website of Dennis Bakhuis: profile, online dive log, blog and TIL.
SvelteKit frontend with a small FastAPI backend. The dive log is the divelog
module: `@divelog/kit` (vendored in `vendor/`) for the pages and `divelog-server` for the backend, both from the divelog monorepo checked out
next to this one (`../divelog`). The blog is the blog module: `@blog/kit`
(vendored in `vendor/`) from the blog repo in `../blog`. Everything personal that
is content — the dive log and the posts — lives in the private
`website-bakhuis-content` repo next to this one; this repo is the wiring.
The design contract lives in [docs/SPEC.md](docs/SPEC.md); how the pieces fit
in [docs/RUNBOOK.md](docs/RUNBOOK.md).

```fish
make install   # pnpm install + uv sync (the divelog CLI from ../divelog)
make run       # divelog-server + Mailpit in Docker, SvelteKit dev server on :5373
```

| URL                            | What                                         |
| ------------------------------ | -------------------------------------------- |
| http://localhost:5373          | The site (front page, /dive, /blog, /admin)  |
| http://localhost:8300/api/docs | FastAPI docs (DEBUG only)                    |
| http://localhost:8325          | Mailpit — magic-link sign-in mails land here |

The dive log and the posts are files in the private `website-bakhuis-content`
repository, checked out next to this one. The backend mounts it (`DATA_REPO` in
`.env`); the frontend build compiles its `posts/` (`CONTENT_DIR`, default
`../website-bakhuis-content/posts`) and refuses to start without them. Sign in at
`/admin/login` with the `OWNER_EMAIL` from `.env`, open the link in Mailpit.

## Stack

| Layer     | Technology                                                                     |
| --------- | ------------------------------------------------------------------------------ |
| Frontend  | SvelteKit 2 + Svelte 5 (runes), TypeScript, adapter-node                       |
| Dive log  | `@divelog/kit` (packed tarball in `vendor/`, `make kit-vendor`)                |
| Backend   | `divelog-server` (Python 3.13, FastAPI) from `../divelog/packages/server`      |
| Data      | Files in the private `website-bakhuis-content` repo, loaded into memory        |
| Media     | Local files in dev (`MEDIA_ROOT`), S3 (Hetzner Object Storage) in prod         |
| Auth      | Owner-only magic link → session cookie                                         |
| Blog      | `@blog/kit` (packed tarball in `vendor/`, `make blog-vendor`) from `../blog`   |
| Content   | Markdown in `$CONTENT_DIR/{blog,til}`, compiled by the kit (mdsvex, Shiki)     |
| Animation | anime.js v4 (front page "Descent", reveals, counters, profile)                 |
| Map       | MapLibre on self-hosted PMTiles (in the kit)                                   |
| Tests     | Vitest here; the kit and the server are tested in the monorepo                 |
| Deploy    | Frontend image from here + `divelog-server` image, a reverse proxy on the host |

## Common commands

| Command                 | Purpose                           |
| ----------------------- | --------------------------------- |
| `make run`              | Everything for local dev          |
| `make up` / `make down` | Just the Docker services          |
| `make data-pull`        | Pull the content repo and reload  |
| `make data-status`      | Status of the data checkout       |
| `make check`            | svelte-check                      |
| `make lint`             | ESLint (zero warnings)            |
| `make test`             | Vitest                            |
| `make kit-vendor`       | Re-pack the kit from ../divelog   |
| `make kit-check`        | Vendored kit = monorepo kit       |
| `make blog-vendor`      | Re-pack the blog kit from ../blog |
| `make blog-check`       | Vendored blog kit = repo kit      |
| `make ci`               | Everything CI runs                |
| `make build`            | Production frontend build         |
| `make docker-build`     | Frontend production image         |

## Project structure

```
src/
  lib/divelog-config.ts  the dive log's personal config (names, URL, copy)
  lib/blog-config.ts     the blog's personal config (names, URL, copy, kinds)
  lib/blog.ts       the posts: $content (CONTENT_DIR) globbed and handed to @blog/kit
  lib/anim/         anime.js helpers (descent, fish)
  lib/components/   home/ (hero, gauge, fish, bubbles), contact form
  lib/server/       cap, e-mail, rate limiter, umami
  routes/           /, dive/ + admin/ (kit catch-alls), blog/ + feed.xml (thin kit wrappers), til/ (redirects), contact, …
content.config.js   CONTENT_DIR: where the posts are
vendor/             @divelog/kit and @blog/kit tarballs
scripts/            sync-version.mjs (VERSION → package.json)
docs/SPEC.md        the spec
docs/RUNBOOK.md     how the pieces fit, the data, the commands
pyproject.toml / uv.lock  uv project that installs divelog-server for the `divelog` CLI
```

## Adding content

- **Blog post**: `posts/blog/<slug>.md` in the content repo with frontmatter
  `title, date, tags, summary, words` (optional `updated`, `draft`, `external`).
  `[[dive:409]]` and `[[site:mex-mayan-blue|text]]` link into the dive log (resolvers in
  `svelte.config.js`). Pages, feed and markdown pipeline come from `@blog/kit`; the copy and
  kinds are in `src/lib/blog-config.ts`. Drafts show in `pnpm dev` only. Commit and push the
  post in the content repo; it goes live with the next build of this site.
- **TIL**: same in `posts/til/`. TIL notes show up in `/blog` as a filter (`?kind=til`); `/til` redirects there.
- **Dives**: through `/admin` — form, photos, logbook scans, or a Subsurface
  import that creates drafts.

## Versioning & deploy

`VERSION` is the single source of truth; `pnpm version:sync` keeps
`package.json` in step and CI fails on drift. Branch flow: feature → `dev`
(auto-deploys to dev.dennisbakhuis.nl) → PR to `main` (must bump `VERSION`).
`docker-publish.yml` builds the frontend image with the posts from the content
repo (secret `CONTENT_REPO_TOKEN`, see the runbook); the deploy runs it next to
`ghcr.io/<owner>/divelog-server:<DIVELOG_SERVER_TAG>` (default `latest`).

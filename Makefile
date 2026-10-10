.DEFAULT_GOAL := help

COMPOSE ?= docker compose

.PHONY: help install run dev up down logs data-pull data-status shell-backend \
	build preview lint format format-check check test test-coverage \
	backend-lint backend-format backend-typecheck backend-test backend-check ci types types-check og-fonts-check \
	version version-sync version-check bump release docker-build

help:  ## Show this help.
	@awk 'BEGIN {FS = ":.*##"; printf "Usage: make <target>\n\nTargets:\n"} \
		/^[a-zA-Z0-9_-]+:.*##/ { printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2 } \
		/^## .*/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 4) }' $(MAKEFILE_LIST)

## Dev

install:  ## Install frontend (pnpm) and backend (uv) dependencies
	pnpm install
	cd backend && uv sync

run: up  ## Start backend + Mailpit in Docker, then the SvelteKit dev server (http://localhost:5373)
	@echo ""
	@echo "✅ Backend:  http://localhost:8300  (docs: http://localhost:8300/api/docs)"
	@echo "   Mailpit:  http://localhost:8325  (magic-link e-mails land here)"
	@echo "   Frontend: http://localhost:5373"
	@echo ""
	pnpm dev

dev: run  ## Alias for `run`

up:  ## Start the docker services in the background (backend, mailpit)
	@test -f .env || cp .env.example .env
	$(COMPOSE) up -d --wait

down:  ## Stop the docker services
	$(COMPOSE) down

logs:  ## Tail docker logs
	$(COMPOSE) logs -f --tail=100

data-pull:  ## Pull the divelog-data checkout and reload the running backend
	git -C $${DATA_REPO:-../divelog-data} pull --ff-only
	curl -fsS -X POST http://localhost:8300/api/v1/admin/repo/reload >/dev/null || true

data-status:  ## Show the divelog-data checkout status
	git -C $${DATA_REPO:-../divelog-data} status --short --branch

tiles:  ## Cut the locator-map basemap tiles into $(MEDIA_DIR)/tiles (needs `brew install pmtiles`)
	uv run --project backend python scripts/build_tiles.py --data $${DATA_REPO:-../divelog-data} --media $${MEDIA_DIR:-../divelog-media}

tiles-upload:  ## Cut the tiles and push tiles/ to the S3 bucket from backend/.env
	uv run --project backend python scripts/build_tiles.py --data $${DATA_REPO:-../divelog-data} --media $${MEDIA_DIR:-../divelog-media} --upload

shell-backend:  ## Shell in the backend container
	$(COMPOSE) exec backend bash

## Build

build:  ## Production build of the frontend
	pnpm build

preview:  ## Build then serve the production bundle (http://localhost:4373)
	pnpm build && pnpm preview

## Quality (frontend)

lint:  ## ESLint — zero warnings allowed
	pnpm lint

format:  ## Prettier write
	pnpm format

format-check:  ## Prettier check (no writes)
	pnpm format:check

check:  ## svelte-check TypeScript / Svelte diagnostics
	pnpm check

test:  ## Vitest unit suite
	pnpm test

test-coverage:  ## Vitest with V8 coverage
	pnpm test:coverage

types:  ## Regenerate src/lib/dive/api.d.ts from the backend's OpenAPI schema (offline, via uv)
	pnpm types

og-fonts-check:  ## Fail if src/lib/divelog/og/font-data.ts is out of date with the TTFs
	pnpm og-fonts:check

types-check:  ## Fail if src/lib/dive/api.d.ts is out of date with the backend schemas
	pnpm types:check

## Quality (backend)

backend-lint:  ## ruff check + format check
	cd backend && uv run ruff check app tests && uv run ruff format --check app tests

backend-format:  ## ruff format
	cd backend && uv run ruff format app tests && uv run ruff check --fix app tests

backend-typecheck:  ## mypy strict
	cd backend && uv run mypy app

backend-test:  ## pytest (unit tests run locally; DB tests need `make up`)
	cd backend && uv run pytest -q

backend-check: backend-lint backend-typecheck backend-test  ## All backend checks

ci: lint format-check check types-check og-fonts-check test-coverage backend-check build  ## Everything CI runs

## Versioning

version:  ## Print the current canonical version
	@cat VERSION

version-sync:  ## Sync package.json version from the VERSION file
	pnpm version:sync

version-check:  ## Fail if package.json drifts from VERSION
	pnpm version:check

bump:  ## Bump the canonical version (usage: make bump VERSION=0.2.0)
	@if [ -z "$(VERSION)" ]; then echo "Usage: make bump VERSION=X.Y.Z" >&2; exit 2; fi
	@echo "$(VERSION)" > VERSION
	pnpm version:sync

release:  ## Bump version, commit, tag (usage: make release VERSION=0.2.0)
	@if [ -z "$(VERSION)" ]; then echo "Usage: make release VERSION=X.Y.Z" >&2; exit 2; fi
	@if ! git diff --quiet || ! git diff --cached --quiet; then \
		echo "Working tree is dirty; commit or stash first." >&2; exit 1; \
	fi
	@echo "$(VERSION)" > VERSION
	pnpm version:sync
	git add VERSION package.json
	git commit -m "Release v$(VERSION)"
	git tag -a "v$(VERSION)" -m "Release v$(VERSION)"
	@echo
	@echo "Tagged v$(VERSION). Push with: git push --follow-tags"

## Docker

docker-build:  ## Build both production images (tags :VERSION and :latest)
	@v=$$(cat VERSION); \
	docker build -t bakhuis-frontend:$$v -t bakhuis-frontend:latest . ; \
	docker build -t bakhuis-backend:$$v -t bakhuis-backend:latest backend

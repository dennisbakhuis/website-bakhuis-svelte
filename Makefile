.DEFAULT_GOAL := help

COMPOSE ?= docker compose

# The private content repository: the dive log (DATA_REPO, mounted into the backend)
# and the blog posts under posts/ (CONTENT_DIR, read by the frontend build).
CONTENT_REPO ?= ../website-bakhuis-content
DATA_REPO ?= $(CONTENT_REPO)
CONTENT_DIR ?= $(CONTENT_REPO)/posts
export CONTENT_DIR

.PHONY: help install run dev up down logs data-pull data-status shell-backend tiles tiles-upload \
	build preview lint format format-check check test test-coverage ci \
	version version-sync version-check bump release docker-build

help:  ## Show this help.
	@awk 'BEGIN {FS = ":.*##"; printf "Usage: make <target>\n\nTargets:\n"} \
		/^[a-zA-Z0-9_-]+:.*##/ { printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2 } \
		/^## .*/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 4) }' $(MAKEFILE_LIST)

## Dev

install:  ## Install frontend (pnpm) and the site tools (uv, divelog-server from ../divelog)
	pnpm install
	uv sync

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

data-pull:  ## Pull the content checkout (log + posts) and reload the running backend
	git -C $(DATA_REPO) pull --ff-only
	curl -fsS -X POST http://localhost:8300/api/v1/admin/repo/reload >/dev/null || true

data-status:  ## Show the content checkout status
	git -C $(DATA_REPO) status --short --branch

tiles:  ## Cut the locator-map basemap tiles into $(MEDIA_DIR)/tiles (needs `brew install pmtiles`)
	uv run divelog tiles --log $(DATA_REPO) --media $${MEDIA_DIR:-../divelog-media}

tiles-upload:  ## Cut the tiles and push tiles/ to the S3 bucket (S3_* from .env)
	uv run divelog tiles --log $(DATA_REPO) --media $${MEDIA_DIR:-../divelog-media} --upload

shell-backend:  ## Shell in the backend container
	$(COMPOSE) exec backend bash

## Build

build:  ## Production build of the frontend
	pnpm build

preview:  ## Build then serve the production bundle (http://localhost:4373)
	pnpm build && pnpm preview

## Quality

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

ci: lint format-check check test-coverage build  ## Everything CI runs

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

docker-build:  ## Build the frontend production image with the posts from $(CONTENT_DIR) (tags :VERSION and :latest)
	@v=$$(cat VERSION); \
	docker build --build-context content=$(CONTENT_DIR) -t bakhuis-frontend:$$v -t bakhuis-frontend:latest .

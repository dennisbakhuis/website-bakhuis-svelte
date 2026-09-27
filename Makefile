.DEFAULT_GOAL := help

COMPOSE ?= docker compose

.PHONY: help install run dev up down logs seed reseed migrate migration shell-db shell-backend \
	build preview lint format format-check check test test-coverage \
	backend-lint backend-format backend-typecheck backend-test backend-check ci \
	version version-sync version-check bump release docker-build

help:  ## Show this help.
	@awk 'BEGIN {FS = ":.*##"; printf "Usage: make <target>\n\nTargets:\n"} \
		/^[a-zA-Z0-9_-]+:.*##/ { printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2 } \
		/^## .*/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 4) }' $(MAKEFILE_LIST)

## Dev

install:  ## Install frontend (pnpm) and backend (uv) dependencies
	pnpm install
	cd backend && uv sync

run: up  ## Start Postgres + backend + Mailpit in Docker, then the SvelteKit dev server (http://localhost:5373)
	@echo ""
	@echo "✅ Backend:  http://localhost:8300  (docs: http://localhost:8300/api/docs)"
	@echo "   Mailpit:  http://localhost:8325  (magic-link e-mails land here)"
	@echo "   Frontend: http://localhost:5373"
	@echo ""
	pnpm dev

dev: run  ## Alias for `run`

up:  ## Start the docker services in the background (db, backend, mailpit)
	@test -f .env || cp .env.example .env
	$(COMPOSE) up -d --wait

down:  ## Stop the docker services
	$(COMPOSE) down

logs:  ## Tail docker logs
	$(COMPOSE) logs -f --tail=100

seed:  ## Seed the sample dive log (no-op when dives already exist)
	$(COMPOSE) exec backend python -m app.seed

reseed:  ## Wipe the database and seed again
	$(COMPOSE) down -v
	$(MAKE) up

migrate:  ## Apply Alembic migrations
	$(COMPOSE) exec backend alembic upgrade head

migration:  ## Autogenerate a migration (usage: make migration M="add trips")
	@if [ -z "$(M)" ]; then echo "Usage: make migration M=\"message\"" >&2; exit 2; fi
	$(COMPOSE) exec backend alembic revision --autogenerate -m "$(M)"

shell-db:  ## psql into the dev database
	$(COMPOSE) exec db psql -U bakhuis -d bakhuis

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

ci: lint format-check check test-coverage backend-check build  ## Everything CI runs

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

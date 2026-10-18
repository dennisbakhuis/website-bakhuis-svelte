# syntax=docker/dockerfile:1
# Frontend image (SvelteKit, adapter-node). The backend is the divelog-server
# image, built from the divelog monorepo.
#
# The blog posts are not in this repository: pass the content repository's
# posts/ directory as the named build context `content`, e.g.
#   docker build --build-context content=../website-bakhuis-content/posts .
# (`make docker-build`; CI passes its checkout the same way). Without it this
# empty stage stands in and `pnpm build` stops with "No blog content in /content".
#
# @divelog/kit and @blog/kit are git dependencies (GitHub, pinned by tag): the
# builder needs git and network access, and pnpm-workspace.yaml allows their
# `prepare` scripts, which build the kits' dist/ during the install.

# Stage 0: the posts (replaced by --build-context content=…)
FROM scratch AS content

# Stage 1: Builder
FROM node:22-slim AS builder

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends git ca-certificates && \
    rm -rf /var/lib/apt/lists/*

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
COPY --from=content / /content/

ENV CONTENT_DIR=/content
RUN pnpm build
RUN pnpm prune --prod --config.confirmModulesPurge=false
RUN node -e "const p=require('./package.json'); delete p.devDependencies; require('fs').writeFileSync('./package.json', JSON.stringify(p, null, 2));"

# Stage 2: Runtime
FROM node:22-slim AS runtime

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 sveltekit

COPY --from=builder --chown=sveltekit:nodejs /app/build ./build
COPY --from=builder --chown=sveltekit:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=sveltekit:nodejs /app/package.json ./package.json

USER sveltekit

EXPOSE 3000

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"

CMD ["node", "build"]

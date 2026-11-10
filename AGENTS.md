# AGENTS.md

Guide for coding agents (and humans) working in this repo. `CLAUDE.md` imports this file.

## What this is

Personal portfolio site. Static-first SvelteKit app: every page is prerendered and served by
Cloudflare Workers as static assets; the Worker script only runs for URLs that match no file.

Stack: SvelteKit 3 · Svelte 5 (runes) · TypeScript 6 · Vite 8 · Tailwind CSS 4 ·
`@sveltejs/adapter-cloudflare` · Wrangler 4 · Vitest · Playwright + axe · pnpm 12 · Node 26.

## Commands

| Command          | Does                                                                        |
| ---------------- | --------------------------------------------------------------------------- |
| `pnpm dev`       | Vite dev server on http://localhost:5173                                    |
| `pnpm build`     | Production build into `.svelte-kit/cloudflare`                              |
| `pnpm preview`   | Serves the build through `wrangler dev` (real Worker + assets) on port 4173 |
| `pnpm check`     | `svelte-check` (types, Svelte diagnostics, a11y warnings)                   |
| `pnpm lint`      | `prettier --check` then `eslint`                                            |
| `pnpm format`    | `prettier --write .`                                                        |
| `pnpm test:unit` | Vitest (`--run` for a single pass)                                          |
| `pnpm test:e2e`  | Builds, serves via `wrangler dev`, runs Playwright (Chromium) + axe         |

Before every commit: `pnpm format && pnpm lint && pnpm check && pnpm test:unit --run`.
A change to anything a visitor sees also runs `pnpm test:e2e`. CI runs all of it.

## Layout

| Path                  | Holds                                                                  |
| --------------------- | ---------------------------------------------------------------------- |
| `src/routes/`         | Pages, `+error.svelte`, `*.e2e.ts` Playwright specs next to the routes |
| `src/lib/components/` | Presentational components (`site-header`, `site-footer`, `seo`)        |
| `src/lib/content/`    | Typed site content (`projects.ts`) + its unit tests                    |
| `src/lib/site.ts`     | Site-wide constants: name, description, production URL, nav            |
| `src/hooks.server.ts` | Security headers for Worker-rendered responses                         |
| `_headers`            | Security headers for static assets and prerendered pages               |
| `vite.config.ts`      | SvelteKit config (adapter, CSP) — there is no `svelte.config.js`       |
| `wrangler.jsonc`      | Worker config; `name` must equal the Cloudflare dashboard Worker name  |
| `docs/`               | Docs index at `docs/README.md`                                         |

## Rules

- **Static first.** `src/routes/+layout.ts` prerenders everything. A route that sets
  `prerender = false` is Worker-rendered; follow the checklist in `docs/llm/architecture.md`.
- **Components take props.** Only routes import `#lib/content`; components stay presentational.
- **Tokens only.** Colours come from the `@theme` tokens in `src/routes/layout.css`
  (`bg-canvas`, `text-ink`, `text-ink-muted`, `border-line`, `bg-panel`, `text-accent`).
  No raw palette classes or hex values in components.
- **Svelte 5 runes** (`$props`, `$state`, `$derived`), event attributes (`onclick`), and the
  native `class={[...]}` array/object syntax instead of class-merging helpers.
- **Links:** internal hrefs go through `resolve()` from `$app/paths` (typed route ids; eslint
  enforces it). Off-site links carry `rel="external noopener"`.
- **Imports:** `#lib/...` for anything under `src/lib`; `.ts` modules are imported with a `.js`
  suffix (`#lib/site.js`), `.svelte` and asset files with their own extension.
- **Accessibility:** one `h1` per page, landmarks from the layout, visible focus, `aria-current`
  on the active nav link. Every route gets e2e + axe coverage (light and dark) in the same PR.

## Gotchas

- `_headers` must sit at the project root (the adapter rejects `static/_headers`) and never
  applies to Worker-rendered responses. That is why `src/hooks.server.ts` sets the same headers;
  keep the two lists identical. `src/routes/security.e2e.ts` checks both paths.
- The CSP `style-src` needs `'unsafe-inline'`: SvelteKit's own markup uses inline style attributes.
- A `<meta>` CSP ignores `frame-ancestors`, so `_headers` sends it as a real header.
- `wrangler types` is deliberately not wired in. After a build its output imports
  `.svelte-kit/cloudflare/_worker`, which makes `svelte-check` type-check build output. Add it back
  with the first Cloudflare binding and generate types before building.
- `Handle` and other hook types come from `@sveltejs/kit/hooks` (SvelteKit 3).
- TypeScript stays below 7 (Renovate is told so) until typescript-eslint supports the native port.

## Svelte MCP

`.mcp.json` registers the official Svelte MCP server. Use its documentation lookup for Svelte and
SvelteKit questions instead of memory (SvelteKit 3 changed config and module paths), and run its
autofixer on new or changed Svelte code until it reports nothing.

## Plans

Implementation plans live in `docs/plans/`. When a plan is done, move what is still true into
`docs/llm/` (or this file) and delete the plan.

Start at [docs/README.md](docs/README.md).

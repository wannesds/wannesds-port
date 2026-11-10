<!-- LLM: Read this when you need to know how a request is served, where code belongs (routes, components, content, hooks), how security headers reach each response, or how to add a project, page or dynamic route. -->

# Architecture

## Rendering model

The root `src/routes/+layout.ts` sets `prerender = true`, so `pnpm build` turns every route into
HTML under `.svelte-kit/cloudflare`. Cloudflare Workers serves those files as static assets, which
are free and never invoke the Worker script. The Worker (`.svelte-kit/cloudflare/_worker.js`, the
SvelteKit server) only runs for a URL with no matching file: today that means 404s.

```
request ──► Cloudflare static assets ──match──► file + `_headers`           (prerendered pages, /_app/*)
                     │
                     └─no match──► Worker (SvelteKit) ──► hooks.server.ts handle ──► +error.svelte (404)
                                                                                  └► non-prerendered routes
```

Trailing slashes are normalised by the asset layer (`/about/` → `/about`).

## Security headers

| Response source           | Headers come from                                                    |
| ------------------------- | -------------------------------------------------------------------- |
| Prerendered pages, assets | `_headers` at the project root (the build copies it into the output) |
| Worker-rendered responses | `handle` in `src/hooks.server.ts`                                    |

Both send `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` and
`Cross-Origin-Opener-Policy` with identical values; keep the two lists in sync.

The Content-Security-Policy comes from the `csp` option in `vite.config.ts` (`mode: 'auto'`):
prerendered pages get a `<meta>` tag with sha256 hashes of SvelteKit's inline scripts, Worker
responses get a header with a per-request nonce. `<meta>` cannot carry `frame-ancestors`, so
`_headers` adds `Content-Security-Policy: frame-ancestors 'none'` for static responses.
HSTS is set on the Cloudflare zone, not in code ([deploy.md](../dev/deploy.md)).

`src/routes/security.e2e.ts` checks the header set on one path of each kind.

## Layers

```
src/routes (pages, load functions)
   ├──► src/lib/components   presentational, props in → markup out
   ├──► src/lib/content      typed data + accessors (leaf)
   └──► src/lib/site.ts      site-wide constants (leaf)
```

- Only routes import `#lib/content`. Components receive content through props.
- `site.ts` and `content/*` import nothing from the app.
- Components may read `$app/state` (e.g. the header reads the current path) and `site.ts`.

## Content

`src/lib/content/projects.ts` holds a typed `Project[]` and exposes `listProjects()` (newest year
first, then title; returns a fresh array) and `getProject(slug)`. Slugs are unique kebab-case
strings; the unit tests enforce it.

When projects need long-form case studies: add mdsvex (`pnpm dlx sv add mdsvex`) and back the
module with `import.meta.glob('./projects/*.md', { eager: true })`, keeping both function
signatures so routes do not change.

## How to

### Add a project

Add an entry to the array in `src/lib/content/projects.ts`. The list page, home page and
`/projects/[slug]` pick it up; `entries()` in `src/routes/projects/[slug]/+page.ts` makes sure the
detail page is prerendered. Run `pnpm test:unit --run` (slug rules) and `pnpm test:e2e`.

### Add a page

1. Create `src/routes/<name>/+page.svelte` with `<Seo title="…" />` and exactly one `h1`.
2. If it belongs in the navigation, add it to `site.nav` in `src/lib/site.ts`.
3. Add the path to the `routes` list in `src/routes/site.e2e.ts`; that gives it render, console,
   canonical, `aria-current` and axe (light + dark) coverage.

### Add a dynamic route (`prerender = false`)

1. Set `export const prerender = false` in the route's `+page.ts`/`+page.server.ts`.
2. It is now served by the Worker: `_headers` no longer applies, `handle` does. Add the path to
   the parity loop in `src/routes/security.e2e.ts`.
3. Worker requests are metered (free tier: 100k/day); prefer prerendering when the data allows it.
4. If it needs Cloudflare bindings (KV, D1, …), declare them in `wrangler.jsonc` and re-introduce
   `wrangler types` (see the gotcha in AGENTS.md).

## Deferred

Not built yet, on purpose: mdsvex, i18n (`sv add paraglide`), component tests
(`sv add vitest="usages:component"`), `sitemap.xml`, OG images, analytics, a theme toggle (needs an
inline script plus its hash in `script-src`), Firefox/WebKit e2e, web fonts, Cloudflare bindings.

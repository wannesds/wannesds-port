# Portfolio Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A deployable, tested SvelteKit skeleton for a personal portfolio — routes, layout shell, content model, security headers, agent docs, CI and dependency automation — with placeholder content and no visual design yet.

**Architecture:** Static-first SvelteKit 3 app. Every route is prerendered at build time and served by Cloudflare Workers as static assets (free, unmetered); the Worker script only runs for requests that match no file — 404s today, dynamic routes later. Content is typed TypeScript data under `src/lib/content/`; routes read it, components receive it as props.

**Tech Stack:** SvelteKit 3.1 · Svelte 5 (runes) · TypeScript 6 · Vite 8 · Tailwind CSS 4.3 · `@sveltejs/adapter-cloudflare` 8 · Wrangler 4 · Vitest 5 · Playwright 1.65 + `@axe-core/playwright` · pnpm 12 · Node 26 LTS · GitHub Actions · Renovate · Cloudflare Workers Builds.

**Spec:** this document's [Design](#design) section. Facts marked *(verified)* were checked against a throwaway scaffold on 2026-11-10 (sv 1.3.0, adapter-cloudflare 8.0.2, wrangler 4.158, vitest 5.1).

## Status

| Task | Status | Evidence |
|---|---|---|
| 0 Root commit, branch, worktree | ☐ | |
| 1 Scaffold + toolchain | ☐ | |
| 2 Content model | ☐ | |
| 3 Shell, routes, SEO, a11y | ☐ | |
| 4 Security headers + CSP | ☐ | |
| 5 Agent + project docs | ☐ | |
| 6 CI, security, Renovate | ☐ | |
| 7 Publish + connect (PAUSE) | ☐ | |
| 8 Final docs pass | ☐ | |

## Worktree and branch

- Repo: `/Users/wannesds/Code/wannesds-port` (initialised 2026-11-10 on `main`, no commits yet).
- Branch: `feat/project-skeleton`.
- Worktree: `/Users/wannesds/Code/wannesds-port--skeleton`. Tasks 1–6 and 8 run there.
- Files to copy into the worktree on creation (`.mcp.json`, `.env`, `CLAUDE.local.md`, `.vscode/`, `.claude/`): none exist on `main` yet, so nothing to copy.

## Process Instructions

- After completing each step, update the plan with its status and evidence.
- Run every step without pausing. Pause only at a decision point the plan names, when a result contradicts the plan, or before an external write.
- Suggest the prompt for continuing to the next step.
- After the last step, make a final documentation pass. Once the contents of the plan have been consolidated into existing documentation, the plan file can be removed. If there is no relevant existing documentation, the plan should be reworked into a reference document.

## Design

### Rendering and hosting

- Cloudflare **Workers** with static assets, not Pages (Cloudflare's current target for new projects; static asset requests are free and unlimited).
- Root `src/routes/+layout.ts` sets `prerender = true`. A route that opts out (`prerender = false`) becomes Worker-rendered — see the header table below.
- A URL matching no asset falls through to the Worker, which renders `src/routes/+error.svelte` with status 404 *(verified)*.
- `/about/` resolves to `/about` through Workers' default trailing-slash handling *(verified)*.
- SvelteKit 3 has no `svelte.config.js`; all kit options (adapter, `csp`, `prerender`) go in `sveltekit({...})` in `vite.config.ts`.

### Security headers: two delivery paths, one header set

| Response source | Mechanism |
|---|---|
| Prerendered pages and assets | `_headers` at the **project root**. The adapter refuses `static/_headers` with a build error *(verified)* and appends its own `/_app/immutable/*` cache rules. |
| Worker responses (404 now, dynamic routes later) | `handle` in `src/hooks.server.ts`. `_headers` never applies to Worker output *(verified)*. |

Header set on both paths:

```
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()
Cross-Origin-Opener-Policy: same-origin
```

plus `frame-ancestors 'none'`: `_headers` sends `Content-Security-Policy: frame-ancestors 'none'`; on Worker responses SvelteKit's own CSP header already contains it.

CSP comes from SvelteKit's `csp` option with `mode: 'auto'`: sha256 hashes in a `<meta>` tag on prerendered pages, a nonce-based header on Worker responses *(verified)*. Directives:

```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;
font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
```

- `style-src` needs `'unsafe-inline'`: SvelteKit's own markup sets inline `style` attributes and logs CSP violations without it *(verified)*.
- A `<meta>` CSP ignores `frame-ancestors`, which is why `_headers` repeats it.
- HSTS is set at the Cloudflare zone once a custom domain exists (runbook §5), not in `_headers`.

### Content model

`src/lib/content/projects.ts` holds a typed array; there is no markdown pipeline yet. Upgrade path for long-form case studies: `pnpm dlx sv add mdsvex`, then back the module with `import.meta.glob('./projects/*.md', { eager: true })` while keeping the `listProjects` / `getProject` signatures.

### Layers

`routes` → `lib/components`, `lib/content`, `lib/site.ts`. Components never import `#lib/content`; they take props. `lib/site.ts` and `lib/content/*` are leaves (no app imports).

### Styling

- Tailwind v4 only. Tokens live in `src/routes/layout.css` under `@theme`, using `light-dark()` with `:root { color-scheme: light dark; }`. Dark mode follows the OS with zero JavaScript.
- Token names: `--color-canvas`, `--color-panel`, `--color-ink`, `--color-ink-muted`, `--color-line`, `--color-accent` (utilities `bg-canvas`, `text-ink`, `border-line`, …). Components use tokens, never raw palette classes or hex.
- No theme toggle: one would need an inline script in `app.html` and its hash added to `script-src`.
- Visual design is out of scope; use placeholder neutrals that pass WCAG AA in both schemes.

### Deliberate deviations from the sv scaffold (each a verified failure)

1. **`wrangler types` removed** (the `--check` in `build`, the `check` prefix, the `gen` script, and `./worker-configuration.d.ts` in tsconfig `types`). After any build, the generated file imports `.svelte-kit/cloudflare/_worker`. As a result, `--check` disagrees between fresh clones and rebuilt trees, and `svelte-check` type-checks build output (450 errors). No bindings exist yet; re-add when the first one lands and generate before building.
2. **`test:e2e` = `playwright test`**: the scaffold's version reinstalls every browser on each run. CI installs Chromium only.
3. **`packageManager` added**: Workers Builds otherwise falls back to its default pnpm 9.10.
4. **Latest majors** for vitest and `@types/node`; **TypeScript held at 6.x** (7.x is the native port, and typescript-eslint support for it is unconfirmed).

### Not in this skeleton (add when needed)

mdsvex, i18n (`sv add paraglide`), component tests (`sv add vitest="usages:component"`), `sitemap.xml`, OG images, analytics, theme toggle, Firefox/WebKit e2e, web fonts, Cloudflare bindings.

## Global Constraints

- **No mention of the owner's employer, its products or its codebases** in any tracked file, path or commit message. The owner keeps the exact name check outside this repo; ask for it before the first push if it is not in your context.
- **Write everything fresh.** Config comes from the official `sv` scaffold or from this plan, never copied from another codebase.
- Versions as in Tech Stack; `typescript` < 7; `wrangler` ≥ 4.135 (needed for preview URLs).
- `.nvmrc` = `26`; `package.json` `packageManager` = `pnpm@12.18.0`.
- Worker name `wannesds-port` everywhere: `wrangler.jsonc` `name` = Cloudflare dashboard name = `package.json` `name`.
- Every route is prerendered unless it opts out. An opt-out route must be covered by the `handle` header test.
- Svelte 5 runes only; event attributes (`onclick`), not `on:click`; class arrays/objects via Svelte's native `class` attribute (no clsx/tailwind-merge).
- Imports via `#lib/...` (the scaffold's subpath import).
- Kebab-case filenames. Workflow files use `.yaml`.
- Commit messages: commitizen style (`feat:`, `fix:`, `test:`, `docs:`, `ci:`, `chore:`).
- Gate before each commit: `pnpm format && pnpm lint && pnpm check`. Add `pnpm test:unit --run` from Task 2 on (vitest exits 1 when no test files exist) and `pnpm test:e2e` from Task 3 on.
- The repo is assumed **public** (a portfolio; this also makes CodeQL, secret scanning and dependency review free). The dependency-review job skips itself on private repos.

## Review Focus

1. Trailing-slash URL (`/about/`) → 200 at `/about`. Pinned by Task 3 `trailing slash resolves`.
2. OS dark mode → no contrast violations. Pinned by Task 3 `axe` running in both colour schemes.
3. JavaScript disabled → navigation and content still work. Pinned by Task 3 `works without javascript`.
4. Unknown project slug → custom 404, not a 500. Pinned by Task 3 `unknown routes 404`.
5. Worker-rendered responses carry the same headers as static ones. Pinned by Task 4 `header parity`.

---

### Task 0: Root commit, branch, worktree

- [ ] **Step 1:** In `/Users/wannesds/Code/wannesds-port` on `main`: `git add docs/plans/portfolio-skeleton.md && git commit -m "docs: add project skeleton plan"`
- [ ] **Step 2:** `git worktree add -b feat/project-skeleton ../wannesds-port--skeleton main`
- [ ] **Step 3:** Verify `git -C ../wannesds-port--skeleton status -sb` → `## feat/project-skeleton`.

### Task 1: Scaffold and harden the toolchain

**Files:**
- Create (via sv): `package.json`, `pnpm-workspace.yaml`, `vite.config.ts`, `tsconfig.json`, `wrangler.jsonc`, `playwright.config.ts`, `eslint.config.js`, `prettier.config.js`, `.prettierignore`, `.gitignore`, `.vscode/`, `src/app.html`, `src/app.d.ts`, `src/routes/*`, `static/robots.txt`
- Create: `.nvmrc`
- Delete: `src/lib/vitest-examples/` and any scaffold `*.e2e.ts`, if generated

**Interfaces:**
- Produces scripts: `dev` (`vite dev`), `build` (`vite build`), `preview` (`wrangler dev .svelte-kit/cloudflare/_worker.js --port 4173`, as scaffolded), `check` (`svelte-kit sync && svelte-check --tsconfig ./tsconfig.json`), `lint`, `format`, `test:unit` (`vitest`), `test:e2e` (`playwright test`), `test` (`pnpm test:unit --run && pnpm test:e2e`).

- [ ] **Step 1: Scaffold into the worktree**

```bash
cd /Users/wannesds/Code/wannesds-port--skeleton
pnpm dlx sv@1.3.0 create --template minimal --types ts --no-dir-check \
  --add prettier eslint vitest="usages:unit" playwright="demo:no" \
  tailwindcss="plugins:typography" \
  sveltekit-adapter="adapter:cloudflare+cfTarget:workers" \
  --install pnpm .
```

Expected: ends with `You're all set!`; `wrangler.jsonc` has `main: ".svelte-kit/cloudflare/_worker.js"` and `assets.directory: ".svelte-kit/cloudflare"`; there is no `svelte.config.js`.

- [ ] **Step 2: Identity.** Set `name` to `wannesds-port` in `package.json` and `wrangler.jsonc`. Add `"packageManager": "pnpm@12.18.0"`. Create `.nvmrc` containing `26`.
- [ ] **Step 3: Apply deviations 1–2** from Design: set the scripts listed under Interfaces (the scaffold's `test` uses `npm run`; switch it to pnpm), delete `gen`, and remove `./worker-configuration.d.ts` from tsconfig `types`.
- [ ] **Step 4: Supply-chain settings.** In `pnpm-workspace.yaml`, keep the scaffold's `allowBuilds` (`workerd`, `esbuild`) and `engineStrict`. Add `minimumReleaseAge: 1440` and `blockExoticSubdeps: true`, each with a one-line comment saying why.
- [ ] **Step 5: Latest majors.** Run `pnpm up --latest '!typescript' && pnpm install`. Expected: `package.json` has vitest `^5`, `@types/node` `^26`, typescript `^6`; `pnpm ignored-builds` lists nothing.
- [ ] **Step 6: Playwright config.** Set `testMatch: '**/*.e2e.ts'`, `webServer: { command: 'pnpm build && pnpm preview', port: 4173, reuseExistingServer: !process.env.CI }`, `use: { baseURL: 'http://localhost:4173' }`, `projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]`, `forbidOnly: !!process.env.CI`, and `reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list'`. Add `playwright-report/` to `.gitignore`.
- [ ] **Step 7:** Delete the scaffold demo files.
- [ ] **Step 8: Verify, including the rebuilt-tree case that broke with `wrangler types`:** run `pnpm lint && pnpm check && pnpm build && pnpm build && pnpm check`. Expected: every command exits 0.
- [ ] **Step 9:** Commit `chore: scaffold sveltekit app for cloudflare workers`.

### Task 2: Content model

**Files:**
- Create: `src/lib/content/projects.ts`
- Test: `src/lib/content/projects.spec.ts`

**Interfaces:**
- Produces:

```ts
export interface Project {
	slug: string; // kebab-case, unique; URL segment of /projects/[slug]
	title: string;
	summary: string; // one sentence; list cards and meta description
	year: number;
	tags: string[];
	links?: { label: string; href: string }[];
}
export function listProjects(): Project[]; // year desc, then title A→Z; returns a fresh array
export function getProject(slug: string): Project | undefined;
```

- [ ] **Step 1: Write the failing tests**

```ts
describe('listProjects', () => {
	it('orders by year desc, then title', () => {
		const slugs = listProjects().map((p) => p.slug);
		expect(slugs).toEqual(['placeholder-c', 'placeholder-a', 'placeholder-b']);
	});
	it('has unique kebab-case slugs', () => {
		const slugs = listProjects().map((p) => p.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
		for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
	});
	it('returns a fresh array', () => {
		listProjects().pop();
		expect(listProjects()).toHaveLength(3);
	});
});
describe('getProject', () => {
	it('finds a project by slug', () => {
		expect(getProject('placeholder-a')?.title).toBe('Placeholder A');
	});
	it('returns undefined for an unknown slug', () => {
		expect(getProject('does-not-exist')).toBeUndefined();
	});
});
```

- [ ] **Step 2:** `pnpm test:unit --run` → FAIL (module not found).
- [ ] **Step 3: Implement.** Seed three placeholders **declared in this order**, so that both the sort and the tiebreak are exercised: `placeholder-b` (title `Placeholder B`, 2024), `placeholder-a` (`Placeholder A`, 2024), `placeholder-c` (`Placeholder C`, 2025).
- [ ] **Step 4:** `pnpm test:unit --run` → PASS.
- [ ] **Step 5: Prove the tests bite.** Remove the title tiebreak → the ordering test goes red. Return the source array directly → the fresh-array test goes red. Restore both.
- [ ] **Step 6:** Commit `feat: add typed project content model`.

### Task 3: Site shell, routes, SEO, accessibility

**Files:**
- Create: `src/lib/site.ts`, `src/lib/components/site-header.svelte`, `src/lib/components/site-footer.svelte`, `src/lib/components/seo.svelte`, `src/routes/+layout.ts`, `src/routes/+error.svelte`, `src/routes/about/+page.svelte`, `src/routes/projects/+page.svelte`, `src/routes/projects/[slug]/+page.ts`, `src/routes/projects/[slug]/+page.svelte`
- Modify: `src/routes/+layout.svelte`, `src/routes/+page.svelte`, `src/routes/layout.css`
- Test: `src/routes/site.e2e.ts`
- Dependency: `pnpm add -D @axe-core/playwright`

**Interfaces:**
- Consumes: `Project`, `listProjects()`, `getProject()` from Task 2.
- Produces:
  - `src/lib/site.ts`: `export const site = { name, description, url, nav } as const`. `name` is a placeholder (`'wannesds'`). `url` is the production origin with no trailing slash; it starts as `'https://example.com'` with `// TODO: set to the production origin (docs/dev/deploy.md)`. `nav` is `[{ href: '/', label: 'Home' }, { href: '/projects', label: 'Projects' }, { href: '/about', label: 'About' }]`.
  - `seo.svelte` props `{ title?: string; description?: string }` render:
    - `<title>`: `` `${title} · ${site.name}` ``, or `site.name` when no title is given
    - `meta[name=description]`, falling back to `site.description`
    - `link[rel=canonical]` = `site.url + page.url.pathname`
    - `og:title`, `og:description`, `og:url`, `og:type=website`
  - `site-header.svelte` takes no props and renders `site.nav`. A link gets `aria-current="page"` when `pathname === href`, or when `href !== '/'` and `pathname` starts with `href + '/'`.
  - `[slug]/+page.ts`: `export const entries: EntryGenerator = () => listProjects().map(({ slug }) => ({ slug }))`. `load` returns `{ project }`, or throws `error(404, 'Project not found')`.
  - Layout markup order:
    1. skip link `<a href="#main">Skip to content</a>`, the first focusable element, visible on focus
    2. `SiteHeader`
    3. `<main id="main" tabindex="-1">`
    4. `SiteFooter`
  - Every page renders `Seo` and exactly one `<h1>`.
  - `+error.svelte` `h1` text: `Page not found` for status 404, `Something went wrong` otherwise, plus a link home.

- [ ] **Step 1: Write `src/routes/site.e2e.ts`** (it fails now). Import `site` and `listProjects` by relative path. Routes under test: `/`, `/projects`, `` `/projects/${listProjects()[0].slug}` ``, `/about`. Tests:
  - `each route renders`: per route, status 200; exactly one `h1`; `<title>` contains `site.name`; canonical `href === site.url + path`; the section's nav link has `aria-current="page"` (Home on `/`, Projects on the list and detail pages, About on `/about`) and no other nav link has it.
  - `no console errors`: per route, the collected console `error` messages equal `[]`. This catches CSP and hydration breakage.
  - `axe`: per route × `colorScheme` `light`/`dark`, `new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()` → `violations` equals `[]`.
  - `unknown routes 404`: `/nope` and `/projects/does-not-exist` respond 404 and render `h1` `Page not found`.
  - `trailing slash resolves`: `goto('/about/')` → status 200 and final pathname `/about`.
  - `skip link`: the first `Tab` focuses a link named `Skip to content` with `href="#main"`.
  - `works without javascript` (`test.use({ javaScriptEnabled: false })`): from `/`, click nav `Projects` → `h1` `Projects` and one link per project; click the first → `h1` equals that project's title.
- [ ] **Step 2:** `pnpm test:e2e` → FAIL.
- [ ] **Step 3: Implement** the files above. In `+layout.ts`, `export const prerender = true;`. In `layout.css`, keep `@import 'tailwindcss'` and the typography plugin, then add `:root { color-scheme: light dark; }` and the `@theme` tokens from Design.
- [ ] **Step 4:** `pnpm test:e2e` → PASS. Then run the commit gate → exit 0.
- [ ] **Step 5: Prove the tests bite.** Drop the `startsWith` clause from `aria-current` → `each route renders` goes red on the project detail page. Remove the skip link → `skip link` goes red. Restore both.
- [ ] **Step 6:** Commit `feat: add site shell, routes and seo`.

### Task 4: Security headers and CSP

**Files:**
- Create: `_headers` (project root), `src/hooks.server.ts`
- Modify: `vite.config.ts` (add `csp` inside `sveltekit({...})`)
- Test: `src/routes/security.e2e.ts`

**Interfaces:**
- Consumes: the routes from Task 3.
- Produces: `export const handle: Handle` in `src/hooks.server.ts`.

- [ ] **Step 1: Write the failing tests**

```ts
const expected = {
	'x-content-type-options': 'nosniff',
	'referrer-policy': 'strict-origin-when-cross-origin',
	'permissions-policy': 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
	'cross-origin-opener-policy': 'same-origin'
};

// header parity: '/' is served from static assets, '/nope' by the Worker
for (const path of ['/', '/nope']) {
	test(`header parity ${path}`, async ({ request }) => {
		const headers = (await request.get(path)).headers();
		for (const [name, value] of Object.entries(expected)) expect(headers[name]).toBe(value);
		expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
	});
}

test('prerendered page carries hashed csp meta', async ({ page }) => {
	await page.goto('/');
	const csp = await page.locator('meta[http-equiv="content-security-policy"]').getAttribute('content');
	expect(csp).toContain("script-src 'self' 'sha256-");
});

test('worker response carries nonce csp header', async ({ request }) => {
	expect((await request.get('/nope')).headers()['content-security-policy']).toContain("'nonce-");
});
```

- [ ] **Step 2:** `pnpm test:e2e` → FAIL.
- [ ] **Step 3: Implement.**
  - `_headers`: one `/*` block with the four headers and `Content-Security-Policy: frame-ancestors 'none'`.
  - `handle`: set the four non-CSP headers on the response from `resolve(event)`. Add a comment saying why both places exist.
  - `csp`: `mode: 'auto'` with the Design directives.
- [ ] **Step 4:** `pnpm test:e2e` → PASS for both e2e files (`no console errors` now also guards the CSP). Then `test -f .svelte-kit/cloudflare/_headers` → exit 0.
- [ ] **Step 5: Prove the tests bite.** Delete `handle` → only `header parity /nope` goes red. Delete `_headers` → only `header parity /` goes red. Restore both.
- [ ] **Step 6:** Commit `feat: add security headers and csp`.

### Task 5: Agent and project docs

**Files:**
- Create: `AGENTS.md`, `CLAUDE.md`, `.mcp.json`, `docs/README.md`, `docs/llm/architecture.md`, `docs/llm/conventions.md`, `docs/dev/setup.md`
- Modify: `README.md`

**Content requirements** (write in your own words; no text copied from elsewhere):

- `CLAUDE.md` contains exactly `@AGENTS.md`, so Claude Code imports the same file other agents read natively. There is one source of truth.
- `AGENTS.md` (aim for ≤ 120 lines):
  1. What this is, plus the stack in one line.
  2. Commands table, then the commit gate and "a UI change runs `pnpm test:e2e`".
  3. Layout map: `src/routes`, `src/lib/components`, `src/lib/content`, `src/lib/site.ts`, `src/hooks.server.ts`, `_headers`, `docs/`.
  4. Rules:
     - static-first (prerender)
     - tokens only
     - components take props
     - Svelte 5 runes
     - a11y basics
     - every route gets e2e and axe coverage in the same PR
  5. Gotchas, stated as facts from Design:
     - `_headers` lives at the root and skips Worker responses
     - `style-src` needs `'unsafe-inline'`
     - why `wrangler types` is absent
     - the Worker name must match the dashboard name
     - TypeScript is held below 7
  6. Svelte MCP: look up Svelte/SvelteKit docs through the `svelte` MCP server and run its autofixer on new Svelte code until it reports nothing.
  7. Plans live in `docs/plans/`. When a plan is finished, fold it into `docs/llm/` and delete it.
  8. Start at `docs/README.md`.
- `.mcp.json`: `{ "mcpServers": { "svelte": { "type": "stdio", "command": "npx", "args": ["-y", "@sveltejs/mcp"] } } }`
- `docs/README.md`: a task router (task → doc to read) and a directory table (`dev/`, `llm/`, `plans/`).
- Every `docs/llm/*.md` starts with `<!-- LLM: Read this when … -->`, one sentence naming what it covers.
- `docs/llm/architecture.md` covers:
  - the rendering model
  - request flow (asset hit vs Worker fallback) as a small text diagram
  - the two header paths
  - layers and import rules
  - the content model and the mdsvex upgrade path
  - how-tos: "Add a project", "Add a page" (route + `Seo` + nav entry + e2e/axe entry), "Add a dynamic route" (`prerender = false` checklist)
- `docs/llm/conventions.md` covers:
  - naming
  - Svelte 5 patterns
  - styling tokens
  - an a11y checklist
  - testing expectations: unit tests for logic, e2e + axe for every route, prove each test can fail
  - comment markers `TODO:` / `FIXME:` / `HACK:`, each with a reason
- `docs/dev/setup.md`: prerequisites (Node from `.nvmrc` via nvm/fnm/mise; pnpm pinned by `packageManager`); first run (`pnpm install`, `pnpm exec playwright install chromium`, `pnpm dev`); VS Code extensions (`.vscode/extensions.json`).
- `README.md`: around 10 lines covering what this is, a quickstart, and a link to `docs/README.md`.

- [ ] **Step 1:** Write the files.
- [ ] **Step 2: Link check.** Run `for f in $(git ls-files -co --exclude-standard 'docs/*.md' | grep -vE '^docs/(README|plans/)'); do grep -q "${f#docs/}" docs/README.md || echo "unlinked: $f"; done` → no output.
- [ ] **Step 3:** `pnpm format && pnpm lint` → exit 0.
- [ ] **Step 4:** Commit `docs: add agent guide and architecture docs`.

### Task 6: CI, security checks, dependency automation

**Files:**
- Create: `.github/workflows/ci.yaml`, `.github/workflows/security.yaml`, `renovate.json`, `docs/dev/ci.md`, `docs/dev/deploy.md`
- Modify: `docs/README.md` (link the two new docs)

**Decisions:**

- **Pinning:** every `uses:` is pinned to a full commit SHA with a `# vX.Y.Z` comment. Resolve the latest release for each action (`actions/checkout`, `pnpm/action-setup`, `actions/setup-node`, `actions/upload-artifact`, `actions/dependency-review-action`, `zizmorcore/zizmor-action`):

  ```bash
  tag=$(gh api repos/<owner>/<action>/releases/latest --jq .tag_name)
  gh api repos/<owner>/<action>/commits/$tag --jq .sha
  ```

- **`ci.yaml`** (`name: CI`):
  - Triggers: `push` to `main`, `pull_request`. Top-level `permissions: contents: read`. `concurrency` keyed on `github.ref` with `cancel-in-progress: true`.
  - Job **`verify`**: `ubuntu-24.04`, 15-minute timeout, env `WRANGLER_SEND_METRICS: 'false'`. Steps in order:
    1. checkout with `persist-credentials: false`
    2. `pnpm/action-setup` with no `version` (it reads `packageManager`)
    3. `setup-node` with `node-version-file: .nvmrc` and `cache: pnpm`
    4. `pnpm install --frozen-lockfile`
    5. `pnpm lint`
    6. `pnpm check`
    7. `pnpm test:unit --run`
    8. `pnpm exec playwright install --with-deps chromium`
    9. `pnpm test:e2e`
    10. if `failure()`, upload `playwright-report/` with `retention-days: 7`
- **`security.yaml`** (`name: Security`): triggers `pull_request` and `push` to `main`; `permissions: contents: read`.
  - Job **`dependency-review`**: `if: github.event_name == 'pull_request' && !github.event.repository.private`. Checkout without credentials, then `dependency-review-action` with `fail-on-severity: high`. A job skipped by `if` still satisfies a required check.
  - Job **`zizmor`**: checkout without credentials, then `zizmor-action` with `advanced-security: false`, so findings fail the job instead of being uploaded as SARIF.
- **`renovate.json`:**

  ```json
  {
  	"$schema": "https://docs.renovatebot.com/renovate-schema.json",
  	"extends": ["config:best-practices", "group:allNonMajor", "schedule:weekly"],
  	"labels": ["dependencies"],
  	"osvVulnerabilityAlerts": true,
  	"vulnerabilityAlerts": { "labels": ["security"] },
  	"lockFileMaintenance": { "enabled": true, "automerge": true },
  	"packageRules": [
  		{
  			"description": "Non-major updates arrive as one weekly PR and merge themselves once required checks pass",
  			"matchUpdateTypes": ["minor", "patch", "digest", "pin", "pinDigest"],
  			"automerge": true
  		},
  		{
  			"description": "TypeScript 7 is the native port; wait for typescript-eslint and svelte-check support",
  			"matchPackageNames": ["typescript"],
  			"allowedVersions": "<7"
  		}
  	]
  }
  ```

  `config:best-practices` pins dependency versions and action digests, and holds npm releases for 3 days (longer than pnpm's 1-day gate, so Renovate PRs always install). Vulnerability fixes ignore the schedule.

- [ ] **Step 1:** Write the three config files.
- [ ] **Step 2: Validate**
  - `pnpm dlx -p renovate renovate-config-validator renovate.json` → `Config validated successfully`
  - `uvx zizmor .github/workflows` → no findings
  - `uvx --from actionlint-py actionlint` → no output
  - `git grep -n 'uses: ' .github | grep -vE '@[0-9a-f]{40} # v'` → no output
- [ ] **Step 3:** Write `docs/dev/ci.md`: what each job checks, how to reproduce it locally, the required-check names (`verify`, `dependency-review`, `zizmor`), and Renovate's behaviour. Write `docs/dev/deploy.md` from the [Operator runbook](#appendix-operator-runbook), reworded as a reference doc. Link both from `docs/README.md`.
- [ ] **Step 4:** `pnpm format && pnpm lint` → exit 0.
- [ ] **Step 5:** Commit `ci: add ci, security checks and renovate`.

### Task 7: Publish and connect — PAUSE: external writes, needs the owner's explicit go

- [ ] Run the owner's private name check over the whole history (`git log -p --all`); it must find nothing.
- [ ] Follow runbook §1–§5 in order.
- [ ] Done when:
  - the PR shows `verify`, `zizmor` and `dependency-review` green
  - the merge triggers a Cloudflare production build
  - `curl -sI https://wannesds-port.<subdomain>.workers.dev/ | grep -i x-content-type-options` → `nosniff`
  - `site.url` is updated to the live origin

### Task 8: Final documentation pass

- [ ] Fold anything in this plan that is not yet in `AGENTS.md` or `docs/` into those files: the Design rationale, the verified gotchas, and "Not in this skeleton" (→ `docs/llm/architecture.md` § Deferred).
- [ ] Delete this plan and commit `docs: fold skeleton plan into reference docs`.

---

## Appendix: Operator runbook

Order matters. Merge the skeleton **before** connecting Cloudflare and Renovate: Cloudflare builds `main` immediately on connect, and Renovate reads its config from the default branch.

### §1 GitHub repository

```bash
cd /Users/wannesds/Code/wannesds-port
gh repo create wannesds-port --public --source=. --remote=origin --push   # pushes main (plan commit)
git -C ../wannesds-port--skeleton push -u origin feat/project-skeleton
gh pr create --head feat/project-skeleton --base main --title "feat: project skeleton" --fill
gh repo edit --enable-auto-merge --delete-branch-on-merge \
  --enable-squash-merge --enable-merge-commit=false --enable-rebase-merge=false
```

### §2 GitHub security features (free on public repos)

```bash
R=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
gh api -X PUT "repos/$R/vulnerability-alerts"                          # Dependabot alerts
gh api -X PATCH "repos/$R" \
  -f 'security_and_analysis[secret_scanning][status]=enabled' \
  -f 'security_and_analysis[secret_scanning_push_protection][status]=enabled'
gh api -X PATCH "repos/$R/code-scanning/default-setup" -f state=configured   # CodeQL, no workflow file
```

Leave **Dependabot security updates off**: Renovate opens those PRs, and having both creates duplicates.

### §3 Ruleset for `main` (after CI has run once on the PR, so the check names exist)

```bash
gh api -X POST "repos/$R/rulesets" --input - <<'EOF'
{
  "name": "main",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "pull_request", "parameters": {
        "required_approving_review_count": 0, "dismiss_stale_reviews_on_push": false,
        "require_code_owner_review": false, "require_last_push_approval": false,
        "required_review_thread_resolution": false } },
    { "type": "required_status_checks", "parameters": {
        "strict_required_status_checks_policy": false,
        "required_status_checks": [
          { "context": "verify" }, { "context": "zizmor" }, { "context": "dependency-review" } ] } }
  ]
}
EOF
```

Then merge the PR: `gh pr merge --squash`. `main` now only receives green, PR-reviewed commits, and that matters because Cloudflare deploys every push to `main`.

### §4 Renovate

1. Install the Renovate GitHub App (github.com/apps/renovate) → **Only select repositories** → `wannesds-port`.
2. Renovate finds `renovate.json` on `main`, so it skips onboarding. It opens a **Dependency Dashboard** issue and a first "pin dependencies" PR, which merges itself once checks pass.
3. Automerge depends on §1 (`--enable-auto-merge`) and §3 (required checks).

### §5 Cloudflare Workers Builds (deploy straight from GitHub)

1. Dashboard → **Workers & Pages** → **Create application** → **GitHub**. Authorise the Cloudflare GitHub app for `wannesds-port` only, then pick the repo.
2. Settings:

   | Field | Value |
   |---|---|
   | Worker name | `wannesds-port` (must equal `name` in `wrangler.jsonc`, or the build fails) |
   | Production branch | `main` |
   | Build command | `pnpm build` |
   | Deploy command | `npx wrangler deploy` (default) |
   | Non-production builds | on; preview command left at default |
   | Root directory | empty |
   | Build variables | none (Node comes from `.nvmrc`, pnpm from `packageManager`) |

3. **Save and Deploy**. The build log should show Node 26.x and pnpm 12.18.0. The site is then live at `https://wannesds-port.<subdomain>.workers.dev`.
4. **PR previews:** every non-`main` branch push builds a preview. Cloudflare comments the Preview URL on the PR and adds a check run. You can add that check to the §3 ruleset. Previews are public; put Cloudflare Access in front if needed.
5. **Custom domain** (the domain must be a zone in this Cloudflare account):
   - Add `"routes": [{ "pattern": "<your-domain>", "custom_domain": true }]` to `wrangler.jsonc`. This keeps the domain in config; Cloudflare creates the DNS record and certificate.
   - Set `site.url` in `src/lib/site.ts`, then merge via PR.
   - Then under **SSL/TLS → Edge Certificates**: enable **Always Use HTTPS** and **HSTS**. Turn on `includeSubDomains`/preload only if every subdomain serves HTTPS.
6. **Troubleshooting:**

   | Symptom | Fix |
   |---|---|
   | Build fails on the Worker name | Make the dashboard name match `wrangler.jsonc` |
   | Lockfile or pnpm errors | `packageManager` is missing or wrong |
   | Wrong Node version | Check `.nvmrc`, or set a `NODE_VERSION` build variable |

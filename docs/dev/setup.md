# Local setup

## Prerequisites

- **Node 26** — the version is in `.nvmrc`; `nvm use`, `fnm use` or `mise` pick it up.
- **pnpm 12** — pinned exactly by `packageManager` in `package.json`. pnpm switches to that version
  on its own; with Corepack, `corepack enable` is enough.

## First run

```bash
pnpm install
pnpm exec playwright install chromium   # browser for e2e tests
pnpm dev                                # http://localhost:5173
```

`pnpm install` refuses package versions published less than a day ago and blocks dependency
install scripts that are not allow-listed (`pnpm-workspace.yaml`). If a fresh release is needed
urgently, wait a day rather than loosening those settings.

## Day to day

- `pnpm preview` serves the production build through `wrangler dev` on http://localhost:4173.
  Use it, not `pnpm dev`, to check headers, 404s or anything Cloudflare-specific.
- `pnpm test:e2e` builds and starts that same server itself; locally it reuses one that is
  already running on 4173.

## Editor

VS Code picks up the recommended extensions from `.vscode/extensions.json` (Svelte, Prettier,
ESLint, Tailwind CSS). Agents get the Svelte MCP server from `.mcp.json`.

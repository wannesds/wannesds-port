# CI and dependency automation

## Workflows

| Workflow                          | Job                 | Runs on               | Checks                                                                                            |
| --------------------------------- | ------------------- | --------------------- | ------------------------------------------------------------------------------------------------- |
| `.github/workflows/ci.yaml`       | `verify`            | PRs, pushes to `main` | `pnpm lint`, `pnpm check`, `pnpm test:unit --run`, `pnpm test:e2e` (build + `wrangler dev` + axe) |
| `.github/workflows/security.yaml` | `dependency-review` | PRs (public repos)    | Fails if the PR adds a dependency with a high/critical advisory                                   |
| `.github/workflows/security.yaml` | `zizmor`            | PRs, pushes to `main` | Static analysis of the workflow files (injection, unpinned actions, leaked credentials)           |

All three are required checks on `main` (ruleset, see [deploy.md](deploy.md) §3). A Playwright
HTML report is uploaded as an artifact when `verify` fails.

Workflow rules: least-privilege `permissions: contents: read`, `persist-credentials: false` on
checkout, every action pinned to a full commit SHA with its version in a comment (Renovate keeps
both current), `.yaml` extension.

## Reproduce locally

```bash
pnpm install --frozen-lockfile
pnpm lint && pnpm check && pnpm test:unit --run && pnpm test:e2e
uvx zizmor .github/workflows                 # workflow audit
uvx --from actionlint-py actionlint           # workflow syntax
npx --yes --package=renovate renovate-config-validator renovate.json
```

## Security features outside CI

Enabled in the repository settings (free on public repos): Dependabot alerts, secret scanning with
push protection, CodeQL default setup. Dependabot _security updates_ stay off; Renovate opens
those PRs.

## Renovate

Config: [`renovate.json`](../../renovate.json).

- `config:best-practices`: pins exact dependency versions and action digests, refreshes the
  lockfile, and holds npm releases for 3 days (longer than pnpm's 1-day `minimumReleaseAge`, so
  every Renovate PR installs).
- All minor/patch/digest updates arrive as **one weekly PR** that merges itself once the
  required checks pass. Majors get their own PR and wait for a human.
- Vulnerability fixes (GitHub advisories and OSV) ignore the schedule and are labelled `security`.
- TypeScript is held below 7.
- The **Dependency Dashboard** issue lists everything pending or rate-limited.

Automerge needs "Allow auto-merge" in the repo settings and the required checks above.

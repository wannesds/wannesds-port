# Deployment

The site deploys through **Cloudflare Workers Builds**: Cloudflare watches the GitHub repo, builds
every push and deploys `main` to production. There are no deploy secrets in GitHub.

Because every push to `main` deploys, `main` only accepts PRs whose required checks are green (§3).

First-time setup order matters:

1. Set `site.url` in `src/lib/site.ts` to the real production origin **before** the first deploy:
   either the custom domain or `https://wannesds-port.<account-subdomain>.workers.dev` (the
   account subdomain is shown under Workers & Pages). Every page's canonical and Open Graph URL
   uses it, so shipping the placeholder tells search engines the site lives at example.com.
2. Merge the skeleton (§1–§3), then connect Renovate (§4) and Cloudflare (§5). Cloudflare builds
   `main` the moment it is connected; Renovate reads its config from `main`.

## §1 GitHub repository

Run from the main checkout (`main` holds only the initial commit; the skeleton is on
`feat/project-skeleton`):

```bash
gh repo create wannesds-port --public --source=. --remote=origin --push
git push -u origin feat/project-skeleton
gh pr create --head feat/project-skeleton --base main --title "feat: project skeleton" --fill
gh repo edit --enable-auto-merge --delete-branch-on-merge \
  --enable-squash-merge --enable-merge-commit=false --enable-rebase-merge=false
```

## §2 Security features

```bash
R=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
gh api -X PUT "repos/$R/vulnerability-alerts"                                   # Dependabot alerts
gh api -X PATCH "repos/$R" \
  -f 'security_and_analysis[secret_scanning][status]=enabled' \
  -f 'security_and_analysis[secret_scanning_push_protection][status]=enabled'
gh api -X PATCH "repos/$R/code-scanning/default-setup" -f state=configured     # CodeQL
```

Leave Dependabot security updates off; Renovate handles them.

## §3 Ruleset for `main`

Create it after CI has run once on a PR, so the check names exist:

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

Then merge the skeleton once its checks are green: `gh pr merge feat/project-skeleton --squash`.

## §4 Renovate

Install the Renovate GitHub App (github.com/apps/renovate) for this repository only. It finds
`renovate.json`, opens a Dependency Dashboard issue and starts proposing PRs. See [ci.md](ci.md).

## §5 Cloudflare Workers Builds

1. Dashboard → **Workers & Pages** → **Create application** → **GitHub**. Authorise the Cloudflare
   GitHub app for this repository only and select it.
2. Settings:

   | Field                 | Value                                                       |
   | --------------------- | ----------------------------------------------------------- |
   | Worker name           | `wannesds-port` — must equal `name` in `wrangler.jsonc`     |
   | Production branch     | `main`                                                      |
   | Build command         | `pnpm build`                                                |
   | Deploy command        | `npx wrangler deploy` (default)                             |
   | Non-production builds | on, default preview command                                 |
   | Root directory        | empty                                                       |
   | Build variables       | none — Node comes from `.nvmrc`, pnpm from `packageManager` |

3. **Save and Deploy.** The build log should show Node 26 and pnpm 12.18. The site is then live at
   `https://wannesds-port.<account-subdomain>.workers.dev`. Check that its canonical link shows
   the `site.url` you set in step 1 of the setup order.
4. **Previews:** every push to another branch builds a preview. Cloudflare comments the preview
   URL on the PR and adds a check run, which can be added to the §3 ruleset. Previews are public;
   put Cloudflare Access in front of them if that matters.

### Custom domain

The domain must be a zone in the same Cloudflare account.

1. Add to `wrangler.jsonc`: `"routes": [{ "pattern": "<domain>", "custom_domain": true }]`.
   Cloudflare creates the DNS record and certificate on the next deploy.
2. Update `site.url` and merge.
3. **SSL/TLS → Edge Certificates:** enable **Always Use HTTPS** and **HSTS**. Only enable
   `includeSubDomains`/preload if every subdomain of the zone serves HTTPS.

### Troubleshooting

| Symptom                          | Cause / fix                                                   |
| -------------------------------- | ------------------------------------------------------------- |
| Build fails on the Worker name   | Dashboard name and `wrangler.jsonc` `name` differ             |
| Lockfile or pnpm version errors  | `packageManager` missing or changed without a lockfile update |
| Wrong Node version               | Check `.nvmrc`, or set a `NODE_VERSION` build variable        |
| PR comment says "No Preview URL" | Preview command was changed from the default                  |

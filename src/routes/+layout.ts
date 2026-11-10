// Static-first: every route is built to HTML and served as a Cloudflare static asset.
// A route that sets `prerender = false` is rendered by the Worker instead (docs/llm/architecture.md).
export const prerender = true;

<!-- LLM: Read this when writing or reviewing Svelte components, styles, imports or tests anywhere under src/. -->

# Conventions

## Naming

- Files and folders: kebab-case (`site-header.svelte`, `projects.spec.ts`).
- Components are imported under a PascalCase name (`import SiteHeader from '…/site-header.svelte'`).
- Functions and variables: camelCase. Module-level constants that never change: UPPER_SNAKE_CASE.
- Unit tests sit next to their module as `*.spec.ts`; e2e specs sit in `src/routes` as `*.e2e.ts`.

## Svelte 5

- Runes only: `$props()` (typed), `$state`, `$derived`, `$effect` for side effects.
- Event attributes (`onclick={…}`), never `on:click`.
- Classes: Svelte's native `class={['base', condition && 'extra']}`; no clsx/tailwind-merge.
- Data that a page needs before render comes from a `load` function (`+page.ts`); static
  content may be imported directly by the route component.
- Internal links: `href={resolve('/projects/[slug]', { slug })}` from `$app/paths`.
  Off-site links: `rel="external noopener"`.

## Imports

- `#lib/...` for everything under `src/lib` (Node subpath import declared in `package.json`).
- `.ts` modules with a `.js` suffix (`#lib/content/projects.js`); `.svelte` and assets with
  their own extension.
- Hook types from `@sveltejs/kit/hooks`; route types from `./$types`.

## Styling

- Tailwind utilities only; a scoped `<style>` block needs a reason in a comment.
- Colours via tokens: `canvas`, `panel`, `ink`, `ink-muted`, `line`, `accent`. Tokens use
  `light-dark()`, so a component never branches on the colour scheme itself.
- New token: add it to `@theme` in `src/routes/layout.css` with both values, and check both
  schemes pass the axe contrast run.
- Long-form text uses the typography plugin: `prose dark:prose-invert`.

## Accessibility checklist

- One `h1` per page; headings do not skip levels.
- Interactive elements are real `<a>`/`<button>` elements; a button that does not submit has
  `type="button"`.
- Icon-only controls have an accessible name.
- Focus stays visible; the skip link remains the first focusable element.
- Navigation marks the current section with `aria-current="page"`.

## Testing

- **Unit (Vitest):** any logic with a branch, sort or rule (e.g. content ordering, slug rules).
- **E2E (Playwright, Chromium):** every route is listed in `src/routes/site.e2e.ts`; anything a
  visitor can see or do gets a spec in the same PR.
- **axe:** runs on every listed route in light and dark mode and must report zero violations.
- **Prove a test can fail:** before trusting a new test, break the code it guards and watch it go
  red, then restore. Assert exact values, not just "contains" or "is not empty".

## Comment markers

Use `TODO:`, `FIXME:` (known wrong behaviour) or `HACK:` (deliberately ugly), each followed by the
reason and, where useful, the doc that explains it. Grep them with `git grep -nE 'TODO:|FIXME:|HACK:'`.

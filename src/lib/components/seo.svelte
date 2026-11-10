<script lang="ts">
	import { page } from '$app/state';
	import { site } from '#lib/site.js';

	let { title, description }: { title?: string; description?: string } = $props();

	const fullTitle = $derived(title ? `${title} · ${site.name}` : site.name);
	const metaDescription = $derived(description ?? site.description);
	const canonical = $derived(site.url + page.url.pathname);
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={metaDescription} />
	<link rel="canonical" href={canonical} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={metaDescription} />
	<meta property="og:url" content={canonical} />
</svelte:head>

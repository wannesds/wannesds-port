<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import SiteFooter from '#lib/components/site-footer.svelte';
	import SiteHeader from '#lib/components/site-header.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<a
	href="#main"
	class="sr-only rounded bg-panel px-3 py-2 text-ink focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
>
	Skip to content
</a>

<div class="flex min-h-dvh flex-col bg-canvas text-ink">
	<SiteHeader />
	<main id="main" tabindex="-1" class="mx-auto w-full max-w-3xl flex-1 px-4 py-10 outline-none">
		{@render children()}
	</main>
	<SiteFooter />
</div>

<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { site } from '#lib/site.js';

	// A section stays current on its sub-pages (/projects/x marks Projects); Home only on '/'.
	function isCurrent(href: string): boolean {
		const path = page.url.pathname;
		return path === href || (href !== '/' && path.startsWith(href + '/'));
	}
</script>

<header class="border-b border-line">
	<div class="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
		<a href={resolve('/')} class="font-semibold text-ink">{site.name}</a>
		<nav aria-label="Main">
			<ul class="flex gap-4">
				{#each site.nav as item (item.href)}
					<li>
						<a
							href={resolve(item.href)}
							aria-current={isCurrent(item.href) ? 'page' : undefined}
							class={[
								'underline-offset-4 hover:underline',
								isCurrent(item.href) ? 'text-ink underline' : 'text-ink-muted'
							]}
						>
							{item.label}
						</a>
					</li>
				{/each}
			</ul>
		</nav>
	</div>
</header>

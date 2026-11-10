<script lang="ts">
	import Seo from '#lib/components/seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const project = $derived(data.project);
</script>

<Seo title={project.title} description={project.summary} />

<article>
	<p class="text-sm text-ink-muted">{project.year}</p>
	<h1 class="text-3xl font-semibold">{project.title}</h1>
	<p class="mt-4">{project.summary}</p>
	{#if project.links?.length}
		<ul class="mt-6 flex gap-4">
			{#each project.links as link (link.href)}
				<li>
					<!-- Project links point off-site: rel="external" skips client-side routing. -->
					<a href={link.href} rel="external noopener" class="text-accent underline">{link.label}</a>
				</li>
			{/each}
		</ul>
	{/if}
</article>

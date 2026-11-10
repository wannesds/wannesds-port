<script lang="ts">
	import { resolve } from '$app/paths';
	import Seo from '#lib/components/seo.svelte';
	import { listProjects } from '#lib/content/projects.js';
	import { site } from '#lib/site.js';

	const featured = listProjects().slice(0, 3);
</script>

<Seo />

<h1 class="text-3xl font-semibold">{site.name}</h1>
<p class="mt-4 text-ink-muted">{site.description}</p>

<h2 class="mt-10 text-xl font-semibold">Selected projects</h2>
<ul class="mt-4 space-y-2">
	{#each featured as project (project.slug)}
		<li>
			<a
				href={resolve('/projects/[slug]', { slug: project.slug })}
				class="text-accent underline-offset-4 hover:underline"
			>
				{project.title}
			</a>
		</li>
	{/each}
</ul>

<script lang="ts">
	import { resolve } from '$app/paths';
	import Seo from '#lib/components/seo.svelte';
	import { listProjects } from '#lib/content/projects.js';

	const projects = listProjects();
</script>

<Seo title="Projects" />

<h1 class="text-3xl font-semibold">Projects</h1>
<ul class="mt-6 space-y-6">
	{#each projects as project (project.slug)}
		<li>
			<a
				href={resolve('/projects/[slug]', { slug: project.slug })}
				class="text-accent underline-offset-4 hover:underline"
			>
				{project.title}
			</a>
			<p class="text-sm text-ink-muted">{project.year} · {project.summary}</p>
		</li>
	{/each}
</ul>

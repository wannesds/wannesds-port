<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Seo from '#lib/components/seo.svelte';

	const heading = $derived(page.status === 404 ? 'Page not found' : 'Something went wrong');
</script>

<Seo title={heading} />

<h1 class="text-3xl font-semibold">{heading}</h1>
<p class="mt-4"><a href={resolve('/')} class="text-accent underline">Back to the home page</a></p>

import { error } from '@sveltejs/kit';
import { getProject, listProjects } from '#lib/content/projects.js';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => listProjects().map(({ slug }) => ({ slug }));

export const load: PageLoad = ({ params }) => {
	const project = getProject(params.slug);
	if (!project) error(404, 'Project not found');
	return { project };
};

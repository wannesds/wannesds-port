export interface Project {
	/** Kebab-case and unique: the URL segment of /projects/[slug]. */
	slug: string;
	title: string;
	/** One sentence, shown in lists and used as the meta description. */
	summary: string;
	year: number;
	tags: string[];
	links?: { label: string; href: string }[];
}

// TODO: replace the placeholders with real projects (docs/llm/architecture.md).
const projects: Project[] = [
	{
		slug: 'placeholder-b',
		title: 'Placeholder B',
		summary: 'A placeholder project, to be replaced with a real case study.',
		year: 2024,
		tags: ['placeholder']
	},
	{
		slug: 'placeholder-a',
		title: 'Placeholder A',
		summary: 'A placeholder project, to be replaced with a real case study.',
		year: 2024,
		tags: ['placeholder']
	},
	{
		slug: 'placeholder-c',
		title: 'Placeholder C',
		summary: 'A placeholder project, to be replaced with a real case study.',
		year: 2025,
		tags: ['placeholder']
	}
];

/** Newest year first, then title A→Z. Returns a fresh array callers may mutate. */
export function listProjects(): Project[] {
	return [...projects].sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
}

export function getProject(slug: string): Project | undefined {
	return projects.find((p) => p.slug === slug);
}

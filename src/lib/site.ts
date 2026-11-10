export const site = {
	name: 'wannesds',
	description: 'Personal portfolio: selected projects and background.',
	// TODO: set to the production origin, no trailing slash (docs/dev/deploy.md).
	url: 'https://example.com',
	nav: [
		{ href: '/', label: 'Home' },
		{ href: '/projects', label: 'Projects' },
		{ href: '/about', label: 'About' }
	]
} as const;

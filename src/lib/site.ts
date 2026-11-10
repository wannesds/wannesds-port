export const site = {
	name: 'wannesds',
	description: 'Personal portfolio: selected projects and background.',
	// Production origin, no trailing slash; canonical and Open Graph URLs use it.
	// Change it here when a custom domain is attached (docs/dev/deploy.md).
	url: 'https://wannesds-port.wannesdieltiens.workers.dev',
	nav: [
		{ href: '/', label: 'Home' },
		{ href: '/projects', label: 'Projects' },
		{ href: '/about', label: 'About' }
	]
} as const;

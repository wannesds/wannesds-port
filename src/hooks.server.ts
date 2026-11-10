import type { Handle } from '@sveltejs/kit/hooks';

// Worker-rendered responses (404s, non-prerendered routes) never get the root `_headers`
// file, which only covers static assets. Keep this set identical to `_headers`; the CSP,
// including frame-ancestors, comes from the `csp` option in vite.config.ts on this path.
const SECURITY_HEADERS = {
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
	'Cross-Origin-Opener-Policy': 'same-origin'
};

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) response.headers.set(name, value);
	return response;
};

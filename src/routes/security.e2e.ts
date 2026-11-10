import { expect, test } from '@playwright/test';

const expected = {
	'x-content-type-options': 'nosniff',
	'referrer-policy': 'strict-origin-when-cross-origin',
	'permissions-policy': 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
	'cross-origin-opener-policy': 'same-origin'
};

// '/' is served from static assets (`_headers`); '/nope' is rendered by the Worker (`handle`).
for (const path of ['/', '/nope']) {
	test(`header parity ${path}`, async ({ request }) => {
		const headers = (await request.get(path)).headers();
		for (const [name, value] of Object.entries(expected)) expect(headers[name]).toBe(value);
		expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
	});
}

test('prerendered page carries hashed csp meta', async ({ page }) => {
	await page.goto('/');
	const csp = await page
		.locator('meta[http-equiv="content-security-policy"]')
		.getAttribute('content');
	expect(csp).toContain("script-src 'self' 'sha256-");
});

test('worker response carries nonce csp header', async ({ request }) => {
	const headers = (await request.get('/nope')).headers();
	expect(headers['content-security-policy']).toContain("'nonce-");
});

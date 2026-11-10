import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { listProjects } from '../lib/content/projects';
import { site } from '../lib/site';

const firstProject = listProjects()[0];

/** Each route under test, its exact document title, and the nav label marked current on it. */
const routes = [
	{ path: '/', title: site.name, current: 'Home' },
	{ path: '/projects', title: `Projects · ${site.name}`, current: 'Projects' },
	{
		path: `/projects/${firstProject.slug}`,
		title: `${firstProject.title} · ${site.name}`,
		current: 'Projects'
	},
	{ path: '/about', title: `About · ${site.name}`, current: 'About' }
];

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

for (const { path, title, current } of routes) {
	test(`each route renders: ${path}`, async ({ page }) => {
		const response = await page.goto(path);
		expect(response?.status()).toBe(200);
		await expect(page.locator('h1')).toHaveCount(1);
		await expect(page).toHaveTitle(title);
		await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', site.url + path);

		const nav = page.getByRole('navigation', { name: 'Main' });
		await expect(nav.getByRole('link', { name: current })).toHaveAttribute('aria-current', 'page');
		await expect(nav.locator('[aria-current]')).toHaveCount(1);
	});

	test(`no console errors: ${path}`, async ({ page }) => {
		const errors: string[] = [];
		page.on('console', (message) => {
			if (message.type() === 'error') errors.push(message.text());
		});
		await page.goto(path);
		await expect(page.locator('h1')).toBeVisible();
		expect(errors).toEqual([]);
	});

	for (const colorScheme of ['light', 'dark'] as const) {
		test(`axe (${colorScheme}): ${path}`, async ({ page }) => {
			await page.emulateMedia({ colorScheme });
			await page.goto(path);
			const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
			expect(results.violations).toEqual([]);
		});
	}
}

// The 404 page is rendered by the Worker, not prerendered, so it gets its own axe run.
for (const colorScheme of ['light', 'dark'] as const) {
	test(`axe (${colorScheme}): worker 404 page`, async ({ page }) => {
		await page.emulateMedia({ colorScheme });
		await page.goto('/nope');
		await expect(page.locator('h1')).toHaveText('Page not found');
		const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
		expect(results.violations).toEqual([]);
	});
}

for (const path of ['/nope', '/projects/does-not-exist']) {
	test(`unknown routes 404: ${path}`, async ({ page }) => {
		const response = await page.goto(path);
		expect(response?.status()).toBe(404);
		await expect(page.locator('h1')).toHaveText('Page not found');
	});
}

test('trailing slash resolves', async ({ page }) => {
	const response = await page.goto('/about/');
	expect(response?.status()).toBe(200);
	expect(new URL(page.url()).pathname).toBe('/about');
});

test('skip link', async ({ page }) => {
	await page.goto('/');
	await page.keyboard.press('Tab');
	const focused = page.locator(':focus');
	await expect(focused).toHaveAccessibleName('Skip to content');
	await expect(focused).toHaveAttribute('href', '#main');
	// Playwright calls clipped sr-only content "visible"; a sighted keyboard user needs it unclipped.
	const clipping = await focused.evaluate((el) => {
		const style = getComputedStyle(el);
		return { clip: style.clip, clipPath: style.clipPath, overflow: style.overflow };
	});
	expect(clipping).toEqual({ clip: 'auto', clipPath: 'none', overflow: 'visible' });
});

test.describe('works without javascript', () => {
	test.use({ javaScriptEnabled: false });

	test('navigate home → projects → project', async ({ page }) => {
		await page.goto('/');
		await page
			.getByRole('navigation', { name: 'Main' })
			.getByRole('link', { name: 'Projects' })
			.click();
		await expect(page.locator('h1')).toHaveText('Projects');
		const main = page.locator('main');
		for (const project of listProjects()) {
			await expect(main.getByRole('link', { name: project.title })).toHaveCount(1);
		}
		await main.getByRole('link', { name: firstProject.title }).click();
		await expect(page.locator('h1')).toHaveText(firstProject.title);
	});
});

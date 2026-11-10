import { describe, expect, it } from 'vitest';
import { getProject, listProjects } from './projects';

describe('listProjects', () => {
	it('orders by year desc, then title', () => {
		const slugs = listProjects().map((p) => p.slug);
		expect(slugs).toEqual(['placeholder-c', 'placeholder-a', 'placeholder-b']);
	});

	it('has unique kebab-case slugs', () => {
		const slugs = listProjects().map((p) => p.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
		for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
	});

	it('returns a fresh array', () => {
		listProjects().pop();
		expect(listProjects()).toHaveLength(3);
	});
});

describe('getProject', () => {
	it('finds a project by slug', () => {
		expect(getProject('placeholder-a')?.title).toBe('Placeholder A');
	});

	it('returns undefined for an unknown slug', () => {
		expect(getProject('does-not-exist')).toBeUndefined();
	});
});

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testMatch: '**/*.e2e.ts',
	forbidOnly: !!process.env.CI,
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
	// Serves the production Worker + static assets through workerd, not the Vite dev server.
	webServer: {
		command: 'pnpm build && pnpm preview',
		port: 4173,
		reuseExistingServer: !process.env.CI
	},
	use: { baseURL: 'http://localhost:4173' },
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});

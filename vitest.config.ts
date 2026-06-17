/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		react({
			jsxImportSource: '@emotion/react',
			babel: {
				plugins: ['@emotion/babel-plugin']
			}
		})
	],
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/vitest-polyfills.ts', './src/vitest-env-setup.ts'],
		server: {
			deps: {
				inline: ['darkreader']
			}
		},
		clearMocks: true,
		restoreMocks: true,
		reporters: ['default', ['junit', { outputFile: 'junit.xml', console: false }]],
		coverage: {
			enabled: false,
			provider: 'v8',
			reporter: ['lcov', 'html'],
			reportsDirectory: 'coverage',
			include: ['src/**/*.{js,ts,tsx,jsx}'],
			exclude: [
				'**/__mocks__/**',
				'**/mocks/**',
				'**/*.test.{js,jsx,ts,tsx}'
			]
		},
		environmentOptions: {
			jsdom: {
				url: 'http://localhost'
			}
		},
		exclude: ['**/node_modules/**', '**/dist/**', '**/build/**']
	}
});

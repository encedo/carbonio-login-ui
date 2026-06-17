/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
module.exports = {
	extends: ['./node_modules/@zextras/carbonio-ui-configs/rules/eslint.js'],
	ignorePatterns: ['src/tests/jsdom-extended.ts'],
	globals: {
		vi: 'readonly'
	},
	settings: {
		'import/resolver': {
			node: {
				extensions: ['.js', '.jsx', '.d.ts', '.ts', '.tsx']
			}
		}
	},
	plugins: ['notice'],
	rules: {
		'arrow-body-style': 'off',
		'prefer-arrow-callback': 'off',
		'no-bitwise': ['error', { allow: ['^', '&', '>>'] }],
		'sonarjs/cognitive-complexity': 'warn',
		'sonarjs/no-duplicate-string': 'warn'
	},
	overrides: [
		{
			files: ['webpack.config.ts'],
			rules: {
				'import/no-extraneous-dependencies': 'off'
			}
		}
	]
};

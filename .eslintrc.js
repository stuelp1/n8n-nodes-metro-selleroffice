module.exports = {
	root: true,
	parserOptions: {
		sourceType: 'module',
	},
	ignorePatterns: [
		'.eslintrc.js',
		'gulpfile.js',
		'dist/**',
		'node_modules/**',
		'package-lock.json',
		'tsconfig.json',
	],
	overrides: [
		{
			files: ['package.json'],
			parser: 'jsonc-eslint-parser',
			plugins: ['eslint-plugin-n8n-nodes-base'],
			extends: ['plugin:n8n-nodes-base/community'],
			rules: {
				'n8n-nodes-base/community-package-json-name-still-default': 'off',
			},
		},
		{
			files: ['./credentials/**/*.ts', './nodes/**/*.ts'],
			parser: '@typescript-eslint/parser',
			parserOptions: {
				project: ['./tsconfig.json'],
				sourceType: 'module',
				extraFileExtensions: ['.json'],
			},
			plugins: ['eslint-plugin-n8n-nodes-base'],
			extends: ['plugin:n8n-nodes-base/community'],
			rules: {
				'n8n-nodes-base/node-param-default-wrong-for-collection': 'off',
			},
		},
	],
};

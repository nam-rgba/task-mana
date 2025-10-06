import eslintPluginPrettier from 'eslint-plugin-prettier'
import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import { defineConfig } from 'eslint/config'

export default defineConfig([
	{
		files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
		plugins: { js },
		extends: ['js/recommended'],
		languageOptions: { globals: { ...globals.browser, ...globals.node } }
	},
	tseslint.configs.recommended,
	{
		plugins: {
			prettier: eslintPluginPrettier
		},
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': 'off',
			'prettier/prettier': [
				'warn',
				{
					arrowParens: 'always',
					semi: false,
					trailingComma: 'none',
					tabWidth: 2,
					endOfLine: 'auto',
					useTabs: true,
					singleQuote: true,
					printWidth: 120,
					jsxSingleQuote: true,
					objectCurlyNewline: 'off',
					'no-multiple-empty-lines': 'off'
				}
			]
		},
		ignores: ['**/node_modules/', '**/dist/']
	}
])

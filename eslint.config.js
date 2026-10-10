import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', '.astro']),
  {
    files: ['**/*.{js,mjs,ts}'],
    extends: [js.configs.recommended, tseslint.configs.recommended, prettierConfig],
    plugins: {
      prettier,
    },
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
])

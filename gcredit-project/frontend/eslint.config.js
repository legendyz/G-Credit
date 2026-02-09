import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      prettierConfig,
    ],
    plugins: {
      prettier,
      'jsx-a11y': jsxA11y,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'prettier/prettier': 'warn',
      // TD-021: Disable false-positive rule for legitimate setState-in-effect patterns
      'react-hooks/set-state-in-effect': 'off',
      // Accessibility rules for Sprint 7 MVP (basic compliance)
      'jsx-a11y/alt-text': 'error', // Images must have alt text
      'jsx-a11y/aria-props': 'error', // Valid ARIA props only
      'jsx-a11y/aria-proptypes': 'error', // Valid ARIA values
      'jsx-a11y/aria-unsupported-elements': 'error', // ARIA on supported elements
      'jsx-a11y/role-has-required-aria-props': 'error', // Required ARIA props
      'jsx-a11y/label-has-associated-control': 'error', // Forms: labels must link to inputs
      'jsx-a11y/no-autofocus': 'warn', // Autofocus can disrupt screen readers (warn only for MVP)
    },
  },
]);

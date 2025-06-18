import eslintPluginTs from '@typescript-eslint/eslint-plugin';
import parserTs from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: parserTs,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': eslintPluginTs,
      prettier: prettierPlugin,
    },
    rules: {
      ...eslintPluginTs.configs.recommended.rules,
      ...eslintPluginTs.configs['recommended-requiring-type-checking'].rules,
      '@typescript-eslint/no-floating-promises': 'error',
      'prettier/prettier': 'warn',
    },
  },
];
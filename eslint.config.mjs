import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const baseDirectory = dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({
  baseDirectory,
  recommendedConfig: js.configs.recommended,
});

export default compat.config({
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/electron',
    'plugin:import/typescript',
  ],
  rules: {
    quotes: 'warn',
    semi: 'warn',
    'eol-last': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-require-imports': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-empty': 'warn',
  },
  parser: '@typescript-eslint/parser',
});

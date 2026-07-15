// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const globals = require('globals');

module.exports = defineConfig([
  expoConfig,
  {
    files: [
      'app/**/*.{ts,tsx}',
      'components/**/*.{ts,tsx}',
      'utils/**/*.{ts,tsx}',
    ],
    ignores: ['utils/Supabase.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/utils/Supabase',
              message:
                'Access Supabase through services/storage/* instead of querying it from UI code.',
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'error',
    },
  },
  {
    files: [
      '**/__tests__/**/*.{js,jsx,ts,tsx}',
      '**/*.{spec,test}.{js,jsx,ts,tsx}',
    ],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
]);

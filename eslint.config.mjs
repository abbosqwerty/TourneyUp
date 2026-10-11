// eslint-config-next 16 ships flat configs directly — no FlatCompat needed.
import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescriptConfig from 'eslint-config-next/typescript'

const config = [
  {
    ignores: ['.next/**', 'node_modules/**', 'deploy/**', 'next-env.d.ts', 'prisma/seed.js'],
  },
  ...coreWebVitals,
  ...typescriptConfig,
  {
    rules: {
      // Unused code is the main thing this config is here to catch.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      // `console.error`/`warn` stay as the deliberate logging channel.
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      '@typescript-eslint/no-explicit-any': 'warn',
      // Images are served as raw bytes from /api/media/[id]; next/image is off.
      '@next/next/no-img-element': 'off',
    },
  },
]

export default config

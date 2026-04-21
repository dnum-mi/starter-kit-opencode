import js from '@eslint/js'

export default [
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.ts'],
    rules: {
      'no-console': 'warn',
    },
    languageOptions: {
      globals: {
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        process: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
                exports: 'readonly',
                URL: 'readonly',
      },
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'coverage/', '**/*.vue'],
  },
]

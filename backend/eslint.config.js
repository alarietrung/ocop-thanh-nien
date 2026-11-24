import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules', 'dist', 'coverage'] },
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'error'
    }
  },
  {
    files: ['src/modules/**/*.controller.js'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/db/**', '**/*.repository.js', '**/*.repository'],
              message: 'Controllers must call services only, never DB clients or repositories directly.'
            }
          ]
        }
      ]
    }
  },
  {
    files: ['src/modules/**/*.repository.js'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/*.controller.js', '**/*.controller', '**/*.routes.js', '**/*.routes'],
              message: 'Repositories must not depend on controllers or routes.'
            }
          ]
        }
      ]
    }
  },
  {
    files: ['src/modules/**/*.js'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '../*/*.repository.js',
                '../*/*.repository',
                '../*/*.service.js',
                '../*/*.service',
                '../*/*.controller.js',
                '../*/*.controller',
                '../*/*.routes.js',
                '../*/*.routes',
                '../*/*.schema.js',
                '../*/*.schema'
              ],
              message: 'Cross-module imports must go through the sibling module public index.js only.'
            }
          ]
        }
      ]
    }
  }
];

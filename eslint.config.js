import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ['eslint.config.js'] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // 原則B: シード付きRNGを強制、Math.randomを禁止
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'シード付き Rng を使うこと (src/core/rng.ts)',
        },
      ],
    },
  },
  // 原則A: core層へのPhaser侵入を禁止
  {
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            'phaser',
            '@/scenes/*',
            '@/objects/*',
            '@/ui/*',
            '**/scenes/**',
            '**/objects/**',
            '**/ui/**',
          ],
        },
      ],
    },
  },
  prettier,
);

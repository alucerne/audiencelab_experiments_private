import baseConfig from '../../tooling/eslint/base.js';

export default [
  ...baseConfig,
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
]; 
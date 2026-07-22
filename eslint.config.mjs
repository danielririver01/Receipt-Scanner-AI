import security from 'eslint-plugin-security';

export default [
  {
    ignores: ['.next/**', 'dist/**', 'build/**', 'node_modules/**'],
  },
  security.configs.recommended,
];

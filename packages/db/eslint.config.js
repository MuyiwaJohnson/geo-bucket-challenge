const baseConfig = require('@geoflow/eslint-config/base.js');

module.exports = [
  baseConfig,
  {
    ignores: ['dist/**', 'node_modules/**', 'migrations/**'],
  },
];


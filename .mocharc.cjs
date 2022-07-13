'use strict'

module.exports = {
  require: [
    // 'tsconfig-paths/register',
    // 'ts-node/register',
    '@flemist/test-utils/register',
  ],
  'watch-files': ['./src/**'],
  ignore       : ['./**/*.d.ts'],
  'node-option': [
    // 'prof',
    'experimental-specifier-resolution=node',
    'loader=@esbuild-kit/esm-loader',
  ],
}

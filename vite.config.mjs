// eslint-disable-next-line node/no-missing-import
import { sveltekit } from '@sveltejs/kit/vite'
import babel from '@rollup/plugin-babel'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// console.log(process.env)

const isTest = process.env.NODE_ENV === 'test'
const isDev = process.env.NODE_ENV === 'development'
const isLegacy = false

/** @type {import('vite').UserConfig} */
const config = {
  test: {
    threads       : false,
    isolate       : false,
    maxConcurrency: 10,
    globals       : true,
    include       : [
      'src/**/*.{e2e,test,stress,perf}.ts',
    ],
    concurrentFiles: true,
  },
  resolve: {
    alias: {
      src: path.resolve(dirname, './src'),
      '~': path.resolve(dirname),
    },
  },
  build: {
    minify       : isTest ? false : 'terser',
    terserOptions: !isTest && !isDev && {
      module  : true,
      ecma    : 5,
      safari10: true,
      mangle  : false,
      format  : {
        comments    : false,
        max_line_len: 50,
      },
    },
  },
  plugins: [
    sveltekit(),
    !isTest && isLegacy && {
      name: 'vite-plugin-babel',
      config(config, config_env) {
        return {
          build: {
            rollupOptions: {
              plugins: [
                babel.default({
                  configFile  : path.resolve(__dirname, '.babelrc.cjs'), // enable babel for node_modules
                  extensions  : ['', '.ts', '.js', '.cjs', '.mjs', '.svelte', '.html'],
                  babelHelpers: 'runtime',
                  exclude     : [
                    '**/node_modules/@babel/**',
                    '**/node_modules/core-js*/**',
                    '**/.svelte-kit/runtime/server/**',
                  ],
                }),
              ],
            },
          },
        }
      },
    },
    // {
    // 	name: 'vite-plugin-print-config',
    // 	configResolved(config, config_env) {
    // 		debugger
    // 		console.log(config)
    // 	},
    // }
  ],
}

export default config

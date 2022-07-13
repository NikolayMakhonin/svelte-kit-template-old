import { sveltekit } from '@sveltejs/kit/vite'
import babel from '@rollup/plugin-babel'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// console.log(process.env)

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
      src: path.resolve(__dirname, './src'),
      '~': path.resolve(__dirname),
    },
  },
  build: {
    minify       : 'terser',
    terserOptions: {
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
    {
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

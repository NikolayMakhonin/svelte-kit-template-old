// import {subscribeUnhandledErrors} from '@flemist/web-logger'
import { sveltekit } from '@sveltejs/kit/vite';
import babel from '@rollup/plugin-babel';
import path from 'path';
import legacy from '@vitejs/plugin-legacy'
// import babel from 'vite-plugin-babel';
// import commonjs from 'vite-plugin-commonjs'
// import commonjs from '@rollup/plugin-commonjs'
// import { viteCommonjs } from '@originjs/vite-plugin-commonjs'
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// subscribeUnhandledErrors({
// 	catchConsoleLevels: null,
// })

/** @type {import('vite').UserConfig} */
const config = {
	// logLevel: 'info',
	// resolve: {
	// 	extensions: ['.js', '.cjs', '.mjs', '.ts', '.json'],
	// },
	// build: {
	// 	// commonjsOptions: {
	// 	// 	transformMixedEsModules: true,
	// 	// 	// dynamicRequireTargets: []
	// 	// },
	// 	rollupOptions: {
	// 		// output: {
	// 		// 	entryFileNames: '[name].mjs',
	// 		// 	chunkFileNames: '[name].mjs',
	// 		// },
	// 		// plugins: [
	// 		// 	babel.default({
	// 		// 		configFile  : path.resolve(__dirname, '.babelrc.cjs'), // enable babel for node_modules
	// 		// 		extensions  : ['.ts', '.js', '.cjs', '.mjs', '.svelte', '.html'],
	// 		// 		babelHelpers: 'runtime',
	// 		// 		exclude     : [
	// 		// 			// '**/node_modules/rollup*/**',
	// 		// 			'**/node_modules/@babel/**',
	// 		// 			'**/node_modules/core-js*/**',
	// 		// 			'**/.svelte-kit/runtime/server/**'
	// 		// 		],
	// 		// 	}),
	// 		// ],
	// 	},
	// },
	build: {
		minify: 'terser',
		terserOptions: {
			module: true,
			ecma: 5,
			safari10: true,
			mangle: false,
			format: {
				comments: false,
				max_line_len: 50,
			},
		},
	},
	plugins: [
		// commonjs.default({
		//
		// }),
		// commonjs({
		// 	transformMixedEsModules: true,
		// }),
		sveltekit(),
		// () => {
		// 	throw new Error('TEST')
		// },
		// babel.default({
		// 	filter: /\.(ts|js|cjs|mjs|svelte)$/,
		// 	babelConfig: {
		// 		configFile: path.resolve(__dirname, '.babelrc.cjs'), // enable babel for node_modules
		// 		// extensions: ['.ts', '.js', '.cjs', '.mjs', '.svelte'],
		// 		// babelHelpers: 'runtime',
		// 		exclude: [
		// 			'**/node_modules/@babel/**',
		// 			'**/node_modules/core-js*/**',
		// 		],
		// 	},
		// }),
		// legacy({
		//
		// 	targets: ['defaults'],
		// 	// renderLegacyChunks: true,
		// }),
		{
			name: 'vite-plugin-babel',
			config(config, config_env) {
				return {
					build: {
						// commonjsOptions: {
						// 	transformMixedEsModules: true,
						// 	// dynamicRequireTargets: []
						// },
						rollupOptions: {
							// output: {
							// 	entryFileNames: '[name].mjs',
							// 	chunkFileNames: '[name].mjs',
							// },
							plugins: [
								babel.default({
									configFile  : path.resolve(__dirname, '.babelrc.cjs'), // enable babel for node_modules
									extensions  : ['', '.ts', '.js', '.cjs', '.mjs', '.svelte', '.html'],
									babelHelpers: 'runtime',
									exclude     : [
										// '**/node_modules/rollup*/**',
										'**/node_modules/@babel/**',
										'**/node_modules/core-js*/**',
										'**/.svelte-kit/runtime/server/**'
									],
								}),
							],
						},
					},
				}
			}
		},
		// {
		// 	name: 'vite-plugin-print-config',
		// 	configResolved(config, config_env) {
		// 		debugger
		// 		console.log(config)
		// 	},
		// }
	],
};

export default config;

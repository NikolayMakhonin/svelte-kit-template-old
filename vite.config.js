import { sveltekit } from '@sveltejs/kit/vite';
import babel from '@rollup/plugin-babel';
import path from 'path';
import { fileURLToPath } from 'url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('vite').UserConfig} */
const config = {
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
									configFile  : path.resolve(dirname, '.babelrc.cjs'), // enable babel for node_modules
									extensions  : ['.ts', '.js', '.cjs', '.mjs', '.svelte', '.html'],
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
	]
};

export default config;

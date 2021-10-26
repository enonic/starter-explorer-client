/* eslint-disable no-console */
import glob from 'glob';
import path from 'path';
import BrowserSyncPlugin from 'browser-sync-webpack-plugin';
import {print} from 'q-i';
//import TerserPlugin from 'terser-webpack-plugin';
import webpack from 'webpack';


//const MODE = 'development';
const MODE = 'production';

const BOOL_LOCAL_JS_UTILS = MODE !== 'production';

const SRC_DIR = 'src/main/resources';
const DST_DIR = 'build/resources/main';

const JS_EXTENSION_GLOB_BRACE = '*.{es,es6,mjs,jsx,flow,js}';
const ASSETS_PATH_GLOB_BRACE = '{site/assets,assets}';

const ALL_JS_ASSETS_GLOB = `${SRC_DIR}/${ASSETS_PATH_GLOB_BRACE}/**/${JS_EXTENSION_GLOB_BRACE}`;
const ALL_JS_ASSETS_FILES = glob.sync(ALL_JS_ASSETS_GLOB);
const SERVER_JS_FILES = glob.sync(`${SRC_DIR}/**/${JS_EXTENSION_GLOB_BRACE}`, {
	ignore: ALL_JS_ASSETS_FILES
});

const dict = arr => Object.assign(...arr.map(([k, v]) => ({ [k]: v })));

const SERVER_JS_ENTRY = dict(SERVER_JS_FILES.map(k => [
	k.replace(`${SRC_DIR}/`, '').replace(/\.[^.]*$/, ''), // name
	`.${k.replace(`${SRC_DIR}`, '')}` // source relative to context
]));

//print({SERVER_JS_ENTRY}, { maxItems: Infinity });
//process.exit();

const SS_ALIAS = {
	'@enonic/js-utils': BOOL_LOCAL_JS_UTILS
		? path.resolve(__dirname, '../enonic-js-utils/dist/cjs/index.js')
		: path.resolve(__dirname, './node_modules/@enonic/js-utils/dist/cjs/index.js'),
};

const SS_EXTERNALS = [
	'/lib/cache',
	/^\/lib\/http-client.*$/,
	/^\/lib\/thymeleaf/,
	/^\/lib\/xp\//
];

if (MODE === 'development') {
	SS_ALIAS['/lib/util'] = path.resolve(__dirname, '../lib-util/src/main/resources/lib/util');
	SS_ALIAS['/lib/explorer'] = path.resolve(__dirname, '../lib-explorer-3.x/src/main/resources/lib/explorer/');
	SS_ALIAS['@enonic/nashorn-polyfills'] = path.resolve(__dirname, '../lib-explorer-3.x/src/main/resources/lib/nashorn/index');

} else {
	SS_EXTERNALS.push(/^\/lib\/explorer.*$/);
	SS_EXTERNALS.push('/lib/util');
	SS_EXTERNALS.push(/^\/lib\/util\//);
}

const SERVER_JS_TEST = /\.(es6?|js)$/i; // Will need js for node module depenencies

const WEBPACK_CONFIG = [{
		context: path.resolve(__dirname, SRC_DIR),
		entry: SERVER_JS_ENTRY,
		externals: SS_EXTERNALS,
		devtool: false, // Don't waste time generating sourceMaps
		mode: MODE,
		module: {
			rules: [{
				test: SERVER_JS_TEST,
				//exclude: /node_modules/,
				exclude: [ // It takes time to transpile, if you know they don't need transpilation to run in Enonic you may list them here:
					/node_modules[\\/]core-js/, // will cause errors if they are transpiled by Babel
					/node_modules[\\/]webpack[\\/]buildin/ // will cause errors if they are transpiled by Babel
					// /\bcore-js\b/,
					// /\bwebpack\b/,
					// /\bregenerator-runtime\b/,
				],
				use: [{
					loader: 'babel-loader',
					options: {
						babelrc: false, // The .babelrc file should only be used to transpile config files.
						comments: false,
						compact: false,
						minified: false,
						plugins: [
							'@babel/plugin-transform-arrow-functions',
							'@babel/plugin-proposal-class-properties',
							'@babel/plugin-proposal-export-default-from', // export v from 'mod'; // I think it adds a default export
							'@babel/plugin-proposal-export-namespace-from', // export * as ns from 'mod';
							'@babel/plugin-proposal-object-rest-spread',
							'@babel/plugin-syntax-dynamic-import', // Allow parsing of import()
							'@babel/plugin-syntax-throw-expressions',
							'@babel/plugin-transform-block-scoped-functions',
							'@babel/plugin-transform-block-scoping',
							'@babel/plugin-transform-classes', // tasks/syncSite/Progress.es
							'@babel/plugin-transform-computed-properties',
							'@babel/plugin-transform-destructuring',
							'@babel/plugin-transform-duplicate-keys',
							'@babel/plugin-transform-for-of',
							'@babel/plugin-transform-function-name',
							'@babel/plugin-transform-instanceof',
							'@babel/plugin-transform-literals',
							'@babel/plugin-transform-new-target',
							'@babel/plugin-transform-member-expression-literals',
							'@babel/plugin-transform-modules-commonjs', // transforms ECMAScript modules to CommonJS
							'@babel/plugin-transform-object-assign', // Not used locally, perhaps in node_modules?
							'@babel/plugin-transform-object-super',
							'@babel/plugin-transform-parameters',
							'@babel/plugin-transform-property-literals',
							'@babel/plugin-transform-property-mutators',
							'@babel/plugin-transform-reserved-words',
							'@babel/plugin-transform-shorthand-properties',
							'@babel/plugin-transform-spread',
							'@babel/plugin-transform-sticky-regex',
							'@babel/plugin-transform-template-literals',
							'@babel/plugin-transform-typeof-symbol',
							'@babel/plugin-transform-unicode-escapes', // This plugin is included in @babel/preset-env
							'@babel/plugin-transform-unicode-regex',
							'array-includes'
						],
						presets: [
							[
								'@babel/preset-env',
								{
									corejs: 3,

									// Enables all transformation plugins and as a result,
									// your code is fully compiled to ES5
									forceAllTransforms: true,

									targets: {
										esmodules: false, // Enonic XP doesn't support ECMAScript Modules
										node: '0.10.48'
									},

									// These first two doesn't include node_modules??? TypeError: deepEqual is not a function
									//useBuiltIns: false // no polyfills are added automatically
									useBuiltIns: 'entry' // replaces direct imports of core-js to imports of only the specific modules required for a target environment

									// This one has Runtime errors
									// java.lang.AssertionError: unknown call type GET:METHOD|PROPERTY|ELEMENT:call(Object)Object@jdk.nashorn.internal.scripts.Script$Recompilation$10565$137806A$fotoware
									//useBuiltIns: 'usage' // polyfills will be added automatically when the usage of some feature is unsupported in target environment
								}
							]//,
							//'@babel/preset-react'
						]
					} // options
				}]
			}]
		}, // module
		optimization: {
			minimize: false
			/*minimize: true,
			minimizer: [
				/*new TerserPlugin({ // Internal Server Error (java.lang.UnsupportedOperationException)
					extractComments: false, // Default is true
					parallel: true,
					terserOptions: {
						// https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
						// https://github.com/terser/terser#minify-options
						/* Default options:
						ecma: undefined,
						parse: {},
						compress: {},
						mangle: true, // Note `mangle.properties` is `false` by default.
						module: false,
						output: null,
						toplevel: false,
						nameCache: null,
						ie8: false,
						keep_classnames: undefined,
						keep_fnames: false,
						safari10: false
					},
					//test: /\.m?js(\?.*)?$/i
					test: SERVER_JS_TEST
				})
				// Currently requires Webpack 4
				/*new UglifyJsPlugin({
					parallel: true, // highly recommended
					sourceMap: false
				})
			]*/
		},
		output: {
			path: path.join(__dirname, DST_DIR),
			filename: '[name].js',
			libraryTarget: 'commonjs'
		}, // output
		performance: {
			hints: false
		},
		plugins: [
			new webpack.ProvidePlugin({
				global: '@enonic/global-polyfill'
			}),
			new BrowserSyncPlugin({
				host: 'localhost',
				port: 3000,
				proxy: 'http://localhost:8080/'
			})

		],
		resolve: {
			alias: SS_ALIAS,
			extensions: ['es', 'js', 'json'].map(ext => `.${ext}`)
		},
		stats: {
			colors: true,
			entrypoints: false,
			hash: false,
			//maxModules: 0, // Removed in Webpack 5
			modules: false,
			moduleTrace: false,
			timings: false,
			version: false
		}
	}
];

//print({WEBPACK_CONFIG}, { maxItems: Infinity });
//process.exit();

export { WEBPACK_CONFIG as default };

/* eslint-disable no-console */
import path from 'path';
import BrowserSyncPlugin from 'browser-sync-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import {webpackServerSideJs} from '@enonic/webpack-server-side-js';


//const MODE = 'development';
const MODE = 'production';


const SS_ALIAS = {};


const SS_EXTERNALS = [
	'/lib/cache',
	/^\/lib\/explorer\//,
	/^\/lib\/http-client.*$/,
	/^\/lib\/xp\//
];


if (MODE === 'development') {
	SS_ALIAS['/lib/util'] = path.resolve(__dirname, '../lib-util/src/main/resources/lib/util');
	SS_ALIAS['/lib/explorer'] = path.resolve(__dirname, '../lib-explorer/src/main/resources/lib/explorer/');
} else {
	SS_EXTERNALS.push('/lib/util');
	SS_EXTERNALS.push(/^\/lib\/util\//);
}


const WEBPACK_CONFIG = [
	webpackServerSideJs({
		__dirname,
		externals: SS_EXTERNALS,
		mode: MODE,
		optimization: {
			minimizer: [
				new TerserPlugin(/*{
					terserOptions: {
						compress: {},
						//mangle: true // This will DESTROY exports!
					}
				}*/)
			]
		},
		plugins: [
			new BrowserSyncPlugin({
				host: 'localhost',
				port: 3000,
				proxy: 'http://localhost:8080/'
			})
		],
		resolveAlias: SS_ALIAS
	})
];

//console.log(`WEBPACK_CONFIG:${JSON.stringify(WEBPACK_CONFIG, null, 4)}`);
//process.exit();

export { WEBPACK_CONFIG as default };

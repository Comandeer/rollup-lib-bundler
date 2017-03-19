import convertCJS from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import preset from 'babel-preset-es2015-rollup';
import uglify from 'rollup-plugin-uglify';

const packageInfo = require( './package.json' );
const banner = `/*! ${packageInfo.name} v${packageInfo.version} | (c) ${new Date().getFullYear()} ${packageInfo.author.name} | ${packageInfo.license} license (see LICENSE) */`;

export default {
	entry: 'src/index.js',
	format: 'cjs',
	moduleName: 'rlb',
	sourceMap: true,
	plugins: [
		convertCJS(),
		babel( {
			presets: [
				[ preset ]
			]
		} ),
		uglify( {
			output: {
				preamble: banner
			}
		} )
	],
	banner,
	dest: packageInfo.main
};

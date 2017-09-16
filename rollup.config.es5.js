import convertCJS from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import preset from '@comandeer/babel-preset-rollup';
import minify from 'rollup-plugin-babel-minify';

const packageInfo = require( './package.json' );
const banner = `/*! ${packageInfo.name} v${packageInfo.version} | (c) ${new Date().getFullYear()} ${packageInfo.author.name} | ${packageInfo.license} license (see LICENSE) */`;

export default {
	input: 'src/index.js',
	name: 'rlb',
	sourcemap: true,
	plugins: [
		convertCJS(),
		babel( {
			babelrc: false,
			presets: [
				[ preset ]
			]
		} ),
		minify( {
			comments: false,
			banner
		} )
	],
	banner,
	output: {
		file: packageInfo.main,
		format: 'cjs'
	}
};

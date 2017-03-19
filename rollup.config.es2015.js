import convertCJS from 'rollup-plugin-commonjs';
import babili from 'rollup-plugin-babili';

const packageInfo = require( './package.json' );
const banner = `/*! ${packageInfo.name} v${packageInfo.version} | (c) ${new Date().getFullYear()} ${packageInfo.author.name} | ${packageInfo.license} license (see LICENSE) */`;

export default {
	entry: 'src/index.js',
	format: 'es',
	sourceMap: true,
	plugins: [
		convertCJS(),
		babili( {
			comments: false,
			banner
		} )
	],
	banner,
	dest: packageInfo.module || packageInfo[ 'jsnext:main' ]
};

import { rollup } from 'rollup';
import convertCJS from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import json from '@rollup/plugin-json';
import babel from '@rollup/plugin-babel';
import preset from '@babel/preset-env';
import generateBanner from './generateBanner.js';
import { node as nodeTarget } from './targets.js';

async function bundler( {
	onWarn,
	config
} ) {
	const inputConfig = getRollupInputConfig( config, onWarn );
	const outputConfigCJS = getRollupOutputConfig( config, 'cjs' );
	const otuputConfigESM = getRollupOutputConfig( config, 'esm' );

	const bundle = await rollup( inputConfig );

	await Promise.all( [
		bundle.write( outputConfigCJS ),
		bundle.write( otuputConfigESM )
	] );
}

function getRollupInputConfig( metadata, onwarn = () => {} ) {
	const plugins = [
		convertCJS(),

		json(),

		babel( {
			babelrc: false,
			babelHelpers: 'bundled',
			presets: [
				[
					preset,
					{
						targets: {
							node: nodeTarget
						}
					}
				]
			]
		} ),

		terser()
	];

	return {
		input: metadata.src,
		/* istanbul ignore next */
		onwarn,
		plugins
	};
}

function getRollupOutputConfig( metadata, format = 'esm' ) {
	const banner = generateBanner( metadata );

	return {
		banner,
		sourcemap: true,
		format,
		file: metadata.dist[ format ],
		exports: 'auto'
	};
}

export default bundler;

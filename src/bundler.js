import { rollup } from 'rollup';
import convertCJS from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import json from '@rollup/plugin-json';
import babel from '@rollup/plugin-babel';
import preset from '@babel/preset-env';
import generateBanner from './generateBanner.js';
import { node as nodeTarget } from './targets.js';

async function bundler( metadata ) {
	const configCJS = getRollupConfig( metadata, true );
	const configESM = getRollupConfig( metadata, false );

	const bundles = await Promise.all( [
		rollup( configCJS ),
		rollup( configESM )
	] );

	return Promise.all( [
		bundles[ 0 ].write( configCJS.output ),
		bundles[ 1 ].write( configESM.output )
	] );
}

function getRollupConfig( metadata, isCJS ) {
	const banner = generateBanner( metadata );
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
		plugins,
		output: {
			banner,
			sourcemap: true,
			format: isCJS ? 'cjs' : 'es',
			file: isCJS ? metadata.dist.cjs : metadata.dist.esm,
			exports: 'auto'
		}
	};
}

export default bundler;

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
	packageInfo
} ) {
	await Promise.all( bundleChunks( packageInfo, onWarn ) );
}

function bundleChunks( packageInfo, onWarn = () => {} ) {
	const distInfo = Object.entries( packageInfo.dist );

	return distInfo.map( ( [ source, output ] ) => {
		return bundleChunk( packageInfo, source, output, { onWarn } );
	} );
}

async function bundleChunk( packageInfo, source, output, { onWarn = () => {} } = {} ) {
	const banner = generateBanner( packageInfo );
	const inputConfig = getRollupInputConfig( source, onWarn );

	const otuputConfigESM = getRollupOutputConfig( output.esm, banner, 'esm' );

	const bundle = await rollup( inputConfig );
	const bundlesPromises = [
		bundle.write( otuputConfigESM )
	];

	if ( output.cjs ) {
		const outputConfigCJS = getRollupOutputConfig( output.cjs, banner, 'cjs' );

		bundlesPromises.push( bundle.write( outputConfigCJS ) );
	} else {
		onWarn( `Skipping CJS build for ${ source }` );
	}

	await Promise.all( bundlesPromises );
}

function getRollupInputConfig( input, onwarn = () => {} ) {
	const plugins = [
		convertCJS(),

		json(),

		{
			renderDynamicImport() {
				return {
					left: 'import(',
					right: ');'
				};
			}
		},

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
		input,
		onwarn,
		plugins
	};
}

function getRollupOutputConfig( outputPath, banner, format = 'esm' ) {
	return {
		banner,
		sourcemap: true,
		format,
		file: outputPath,
		exports: 'auto'
	};
}

export default bundler;

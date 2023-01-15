import { rollup } from 'rollup';
import convertCJS from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import json from '@rollup/plugin-json';
import babel from '@rollup/plugin-babel';
import preset from '@babel/preset-env';
import typescript from '@rollup/plugin-typescript';
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
	const inputConfig = getRollupInputConfig( source, output, onWarn );

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

function getRollupInputConfig( input, output, onwarn = () => {} ) {
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

	// In case of TypeScript, we need to add the plugin.
	// We need to add it before the Babel plugin, so it's at index 2.
	// Yep, it's not too elegant…
	if ( output.type === 'ts' ) {
		plugins.splice( 2, 0, typescript( {
			tsconfig: output.tsConfig ? output.tsConfig : false
		} ) );
	}

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

import babelImportAssertionsPlugin from '@babel/plugin-syntax-import-assertions';
import babelPreset from '@babel/preset-env';
import babel from '@rollup/plugin-babel';
import convertCJS from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { rollup } from 'rollup';
import preserveShebang from 'rollup-plugin-preserve-shebang';
import bundleTypes from './bundler/bundleTypes.js';
import fixBinPermissions from './bundler/fixBinPermissions.js';
import preserveDynamicImports from './bundler/rollupPlugins/preserveDynamicImports.js';
import resolveOtherBundles from './bundler/rollupPlugins/resolveOtherBundles.js';
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
	const inputConfig = getRollupInputConfig( packageInfo, source, output, onWarn );

	const otuputConfigESM = getRollupOutputConfig( output.esm, banner, 'esm' );

	const bundle = await rollup( inputConfig );
	const bundlesPromises = [
		bundle.write( otuputConfigESM )
	];

	if ( output.cjs ) {
		const outputConfigCJS = getRollupOutputConfig( output.cjs, banner, 'cjs' );

		bundlesPromises.push( bundle.write( outputConfigCJS ) );
	}

	await Promise.all( bundlesPromises );

	if ( output.isBin ) {
		await fixBinPermissions( packageInfo.project, output );
	}

	if ( output.types ) {
		await bundleTypes( {
			packageInfo,
			sourceFile: source,
			outputFile: output.types,
			tsConfig: output.tsConfig,
			onWarn
		} );
	}
}

function getRollupInputConfig( packageInfo, input, output, onwarn = () => {} ) {
	const plugins = [
		convertCJS(),

		json(),

		resolveOtherBundles( packageInfo.project, packageInfo.dist ),

		preserveDynamicImports(),

		babel( {
			babelrc: false,
			babelHelpers: 'bundled',
			plugins: [
				babelImportAssertionsPlugin
			],
			presets: [
				[
					babelPreset,
					{
						targets: {
							node: nodeTarget
						}
					}
				]
			],
			extensions: [
				'.js',
				'.mjs',
				'.cjs',
				'.ts',
				'.mts',
				'.cts'
			]
		} ),

		preserveShebang(),

		terser()
	];

	// In case of TypeScript, we need to add the plugin.
	// We need to add it before the Babel plugin
	// and after the custom resolver, so it's at index 3.
	// Yep, it's not too elegant…
	if ( output.type === 'ts' ) {
		plugins.splice( 3, 0, typescript( {
			tsconfig: output.tsConfig ? output.tsConfig : false,
			declaration: false
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

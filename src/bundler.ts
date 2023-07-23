import babelImportAssertionsPlugin from '@babel/plugin-syntax-import-assertions';
import babelPreset from '@babel/preset-env';
import babel from '@rollup/plugin-babel';
import convertCJS from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { InputOptions, OutputOptions, rollup } from 'rollup';
import preserveShebang from 'rollup-plugin-preserve-shebang';
import bundleTypes from './bundler/bundleTypes.js';
import fixBinPermissions from './bundler/fixBinPermissions.js';
import preserveDynamicImports from './bundler/rollupPlugins/preserveDynamicImports.js';
import resolveLinkedBundles from './bundler/rollupPlugins/resolveLinkedBundles.js';
import generateBanner from './generateBanner.js';
import { node as nodeTarget } from './targets.js';
import { PackageMetadata, SubPathMetadata } from './packageParser.js';
import { OnWarnCallback } from './OutputController.js';

interface BundlerOptions {
	onWarn?: OnWarnCallback;
	packageInfo: PackageMetadata;
}

export default async function bundler( {
	onWarn,
	packageInfo
}: BundlerOptions ): Promise<void> {
	await Promise.all( bundleChunks( packageInfo, onWarn ) );
}

function bundleChunks( packageInfo: PackageMetadata, onWarn: OnWarnCallback = (): void => {} ): Array<Promise<void>> {
	const distInfo = Object.entries( packageInfo.dist );

	return distInfo.map( ( [ source, output ] ) => {
		return bundleChunk( packageInfo, source, output, { onWarn } );
	} );
}

async function bundleChunk(
	packageInfo: PackageMetadata,
	source: string,
	output: SubPathMetadata,
	{
		onWarn = (): void => {}
	}: {
		onWarn?: OnWarnCallback;
	} = {}
): Promise<void> {
	const banner = generateBanner( packageInfo );
	const inputConfig = getRollupInputConfig( packageInfo, source, output, onWarn );

	const outputConfig = getRollupOutputConfig( output.esm, banner );

	const bundle = await rollup( inputConfig );

	await bundle.write( outputConfig );

	if ( output.isBin ) {
		await fixBinPermissions( packageInfo.project, output );
	}

	if ( output.types !== undefined ) {
		await bundleTypes( {
			packageInfo,
			sourceFile: source,
			outputFile: output.types,
			tsConfig: output.tsConfig,
			onWarn
		} );
	}
}

function getRollupInputConfig(
	packageInfo: PackageMetadata,
	input: string,
	output: SubPathMetadata,
	onwarn: OnWarnCallback = (): void => {}
): InputOptions {
	const plugins = [
		// @ts-expect-error Import is callable but TS mistakenly claims it's not.
		convertCJS(),

		// @ts-expect-error Import is callable but TS mistakenly claims it's not.
		json(),

		resolveLinkedBundles( packageInfo.project, packageInfo.dist ),

		preserveDynamicImports(),

		// @ts-expect-error Import is callable but TS mistakenly claims it's not.
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

		// @ts-expect-error Import is callable but TS mistakenly claims it's not.
		terser()
	];

	// In case of TypeScript, we need to add the plugin.
	// We need to add it before the Babel plugin
	// and after the custom resolver, so it's at index 3.
	// Yep, it's not too elegant…
	if ( output.type === 'ts' ) {
		// @ts-expect-error Import is callable but TS mistakenly claims it's not.
		plugins.splice( 3, 0, typescript( {
			tsconfig: output.tsConfig ?? false,
			declaration: false
		} ) );
	}

	return {
		input,
		onwarn,
		plugins
	};
}

function getRollupOutputConfig( outputPath, banner ): OutputOptions {
	return {
		banner,
		sourcemap: true,
		format: 'esm',
		file: outputPath,
		exports: 'auto'
	};
}

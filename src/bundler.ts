import babelImportAssertionsPlugin from '@babel/plugin-syntax-import-assertions';
import babelPreset from '@babel/preset-env';
import babel from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import typescript, { type PartialCompilerOptions } from '@rollup/plugin-typescript';
import { type InputOptions, type OutputOptions, rollup } from 'rollup';
import preserveShebang from 'rollup-plugin-preserve-shebang';
import { bundleTypes } from './bundler/bundleTypes.js';
import { fixBinPermissions } from './bundler/fixBinPermissions.js';
import { preserveDynamicImports } from './bundler/rollupPlugins/preserveDynamicImports.js';
import { resolveLinkedBundles } from './bundler/rollupPlugins/resolveLinkedBundles.js';
import { generateBanner } from './generateBanner.js';
import type { PackageMetadata, SubPathMetadata } from './packageParser.js';
import type { OnWarnCallback } from './OutputController.js';
import { dirname } from 'pathe';

interface BundlerOptions {
	onWarn?: OnWarnCallback;
	packageMetadata: PackageMetadata;
}

export async function bundler( {
	onWarn,
	packageMetadata
}: BundlerOptions ): Promise<void> {
	await Promise.all( bundleChunks( packageMetadata, onWarn ) );
}

function bundleChunks( packageMetadata: PackageMetadata, onWarn: OnWarnCallback = (): void => {} ): Array<Promise<void>> {
	const distInfo = Object.entries( packageMetadata.dist );

	return distInfo.map( ( [ source, output ] ) => {
		return bundleChunk( packageMetadata, source, output, { onWarn } );
	} );
}

async function bundleChunk(
	packageMetadata: PackageMetadata,
	source: string,
	output: SubPathMetadata,
	{
		onWarn = (): void => {}
	}: {
		onWarn?: OnWarnCallback;
	} = {}
): Promise<void> {
	const banner = generateBanner( packageMetadata );
	const inputConfig = getRollupInputConfig( packageMetadata, source, output, onWarn );

	const outputConfig = getRollupOutputConfig( output.esm, banner );

	const bundle = await rollup( inputConfig );

	await bundle.write( outputConfig );

	if ( output.isBin ) {
		await fixBinPermissions( packageMetadata.project, output );
	}

	if ( output.types !== undefined ) {
		await bundleTypes( {
			packageMetadata,
			sourceFile: source,
			outputFile: output.types,
			tsConfig: output.tsConfig,
			onWarn
		} );
	}
}

function getRollupInputConfig(
	packageMetadata: PackageMetadata,
	input: string,
	output: SubPathMetadata,
	onwarn: OnWarnCallback = (): void => {}
): InputOptions {
	const plugins = [
		// @ts-expect-error Import is callable but TS mistakenly claims it's not.
		json(),

		resolveLinkedBundles( packageMetadata.project, packageMetadata.dist ),

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
							node: packageMetadata.targets.node
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
		const pluginConfig = getTSPluginConfig( output );

		// @ts-expect-error Import is callable but TS mistakenly claims it's not.
		plugins.splice( 3, 0, typescript( pluginConfig ) );
	}

	return {
		input,
		onwarn,
		plugins
	};
}

function getRollupOutputConfig( outputPath: string, banner: string ): OutputOptions {
	return {
		banner,
		sourcemap: true,
		format: 'esm',
		file: outputPath,
		exports: 'auto'
	};
}

interface TSPluginConfig {
	tsconfig: string | boolean;
	declaration: false;
	compilerOptions: PartialCompilerOptions;
}

function getTSPluginConfig( { esm, tsConfig }: SubPathMetadata ): TSPluginConfig {
	const config: TSPluginConfig = {
		tsconfig: tsConfig ?? false,
		declaration: false,
		compilerOptions: {
			lib: [ 'ESNext' ],
			target: 'ESNext',
			module: 'NodeNext',
			moduleResolution: 'NodeNext'
		}
	};

	// Outdir override fails for projects without the tsconfig.json file.
	if ( tsConfig !== undefined ) {
		config.compilerOptions.outDir = dirname( esm );
	}

	return config;
}

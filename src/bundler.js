import { basename } from 'node:path';
import { dirname } from 'node:path';
import { resolve as resolvePath } from 'node:path';
import normalizePath from 'normalize-path';
import { rollup } from 'rollup';
import convertCJS from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';
import babel from '@rollup/plugin-babel';
import preset from '@babel/preset-env';
import typescript from '@rollup/plugin-typescript';
import { rimraf } from 'rimraf';
import generateBanner from './generateBanner.js';
import { node as nodeTarget } from './targets.js';

/**
 * @type {import('globby').globby}
 */
let globby;

async function bundler( {
	onWarn,
	packageInfo
} ) {
	if ( !globby ) {
		const globbyModule = await import( 'globby' );
		// eslint-disable-next-line require-atomic-updates
		globby = globbyModule.globby;
	}

	await Promise.all( bundleChunks( packageInfo, onWarn ) );
	await removeLeftovers( packageInfo );
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

	if ( output.types ) {
		await bundleTypes( {
			sourceFile: source,
			outputFile: output.types,
			onWarn
		} );
	}
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

async function bundleTypes( {
	sourceFile,
	outputFile,
	onWarn = () => {}
} = {} ) {
	const input = getOriginalDTsFilePath();
	const rollupConfig = {
		input,
		plugins: [
			dts()
		],
		onwarn: onWarn
	};
	const outputConfig = {
		file: outputFile,
		format: 'es'
	};
	const bundle = await rollup( rollupConfig );

	await bundle.write( outputConfig );

	function getOriginalDTsFilePath() {
		const fileName = basename( sourceFile, '.ts' );
		const originalFileName = `${ fileName }.d.ts`;
		const declarationDirPath = dirname( outputFile );
		const originalFilePath = resolvePath( declarationDirPath, originalFileName );

		return originalFilePath;
	}
}

async function removeLeftovers( packageInfo ) {
	const distInfo = Object.entries( packageInfo.dist );
	const allowedDefinitionFiles = distInfo.reduce( ( allowed, [ , output ] ) => {
		if ( !output.types ) {
			return allowed;
		}

		const absoluteTypesPath = resolvePath( packageInfo.project, output.types );
		const declarationDirPath = dirname( absoluteTypesPath );

		if ( !allowed.has( declarationDirPath ) ) {
			allowed.set( declarationDirPath, new Set() );
		}

		allowed.get( declarationDirPath ).add( normalizePath( absoluteTypesPath ) );

		return allowed;
	}, new Map() );
	const rimrafPromises = [ ...allowedDefinitionFiles ].map( async ( [ dir, allowedDefinitionFiles ] ) => {
		const allDefinitionFiles = await globby( [
			'**/*.d.ts'
		], {
			cwd: dir,
			absolute: true
		} );
		const definitionFilesToRemove = allDefinitionFiles.filter( ( file ) => {
			return !allowedDefinitionFiles.has( file );
		} );

		return rimraf( definitionFilesToRemove );
	} );

	return Promise.all( rimrafPromises );
}

export default bundler;

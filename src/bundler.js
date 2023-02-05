import { dirname } from 'node:path';
import { join as joinPath } from 'node:path';
import { normalize as normalizePath } from 'node:path';
import { resolve as resolvePath } from 'node:path';
import { rollup } from 'rollup';
import convertCJS from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';
import terser from '@rollup/plugin-terser';
import virtual from '@rollup/plugin-virtual';
import json from '@rollup/plugin-json';
import babel from '@rollup/plugin-babel';
import preset from '@babel/preset-env';
import typescript from '@rollup/plugin-typescript';
import ts from 'typescript';
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
			project: packageInfo.project,
			sourceFile: source,
			outputFile: output.types,
			tsConfig: output.tsConfig,
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

async function bundleTypes( {
	project,
	sourceFile,
	outputFile,
	tsConfig,
	onWarn = () => {}
} = {} ) {
	project = normalizePath( project );

	const userCompilerOptions = getUserCompilerOptions( tsConfig );
	const compilerOptions = {
		...userCompilerOptions,
		declaration: true,
		emitDeclarationOnly: true
	};

	// Remove all options that can change the emitted output.
	delete compilerOptions.outDir;
	delete compilerOptions.declarationDir;
	delete compilerOptions.outFile;
	delete compilerOptions.rootDir;

	const tsFiles = await globby( 'src/**/*.ts', {
		absolute: true,
		cwd: project
	} );
	const emittedFiles = {};

	const host = ts.createCompilerHost( compilerOptions );
	host.writeFile = ( filePath, contents ) => {
		const relativeFilePath = getRelativePath( filePath );

		emittedFiles[ relativeFilePath ] = contents;
	};

	// Prepare and emit the d.ts files
	const program = ts.createProgram( tsFiles, compilerOptions, host );
	program.emit();

	const input = getOriginalDTsFilePath();
	const rollupConfig = {
		input,
		plugins: [
			{
				resolveId: ( imported, importer ) => {
					// Skip the main file.
					if ( !importer ) {
						return null;
					}

					const importerDir = dirname( importer );
					const jsExtensionRegex = /\.(m|c)?js$/;

					imported = joinPath( importerDir, imported );

					// We need full file path, with extension here.
					// Due to that we need to:
					// 1. Remove JS extension (in ESM-based projects
					//    TS tends to add it).
					// 2. Add the .d.ts extension.
					if ( !imported.endsWith( '.d.ts' ) ) {
						imported = `${ imported.replace( jsExtensionRegex, '' ) }.d.ts`;
					}

					return imported;
				}
			},

			virtual( emittedFiles ),

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

	function getUserCompilerOptions( tsConfig ) {
		if ( !tsConfig ) {
			return {};
		}

		const tsConfigFilePath = resolvePath( project, tsConfig );
		const tsConfigContent = ts.readConfigFile( tsConfigFilePath, ts.sys.readFile );
		const parsedOptions = ts.parseJsonConfigFileContent( tsConfigContent.config, ts.sys, project );

		return parsedOptions.options;
	}

	function getOriginalDTsFilePath() {
		// We need the relative path to the .d.ts file. So:
		// 1. Get the relative path via getRelativePath().
		// 2. Replace the .ts extension with the .d.ts one.
		const originalFilePath = getRelativePath( sourceFile ).replace( /\.ts$/, '.d.ts' );

		return originalFilePath;
	}

	function getRelativePath( filePath ) {
		// We need the relative path to the .d.ts file. So:
		// 1. Normalize the filePath (just to be sure).
		// 2. Remove the project path.
		// 3. Remove the leading slash/backslash.
		const relativeFilePath = normalizePath( filePath ).
			replace( project, '' ).
			replace( /^[/\\]/, '' );

		return relativeFilePath;
	}
}

export default bundler;

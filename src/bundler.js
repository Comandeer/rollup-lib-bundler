import { mkdir } from 'node:fs/promises';
import { writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { resolve as resolvePath } from 'node:path';
import { rollup } from 'rollup';
import convertCJS from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';
import terser from '@rollup/plugin-terser';
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

/**
 * @type {import('tempy').temporaryDirectoryTask}
 */
let temporaryDirectoryTask;

async function bundler( {
	onWarn,
	packageInfo
} ) {
	if ( !globby ) {
		const globbyModule = await import( 'globby' );
		// eslint-disable-next-line require-atomic-updates
		globby = globbyModule.globby;
	}

	if ( !temporaryDirectoryTask ) {
		const tempyModule = await import( 'tempy' );
		// eslint-disable-next-line require-atomic-updates
		temporaryDirectoryTask = tempyModule.temporaryDirectoryTask;
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
	onWarn = () => {}
} = {} ) {
	return temporaryDirectoryTask( async ( outDirPath ) => {
		const tsFiles = await globby( 'src/**/*.ts', {
			cwd: project
		} );
		const compilerOptions = {
			declaration: true,
			emitDeclarationOnly: true
		};
		const emittedFiles = {};

		// Just to be sure…
		delete compilerOptions.declarationDir;

		const host = ts.createCompilerHost( compilerOptions );
		host.writeFile = ( fileName, contents ) => {
			emittedFiles[ fileName ] = contents;
		};

		// Prepare and emit the d.ts files
		const program = ts.createProgram( tsFiles, compilerOptions, host );
		program.emit();

		const fsPromises = Object.entries( emittedFiles ).map( async ( [ name, content ] ) => {
			const filePath = resolvePath( outDirPath, name );
			const dirPath = dirname( filePath );

			await mkdir( dirPath, {
				recursive: true
			} );

			return writeFile( filePath, content, {
				encoding: 'utf-8',
				flag: 'w'
			} );
		} );

		await Promise.all( fsPromises );

		const input = getOriginalDTsFilePath( outDirPath );
		const rollupConfig = {
			input,
			plugins: [
				{
					// Fix "CWD" issue.
					// See: https://github.com/rollup/rollup/issues/558.
					resolveId: ( imported ) => {
						if ( imported.startsWith( outDirPath ) ) {
							return imported;
						}

						return null;
					}
				},

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
	} );

	function getOriginalDTsFilePath( outDirPath ) {
		// We need the relative path to the .d.ts file. So:
		// 1. Replace the .ts extension with the .d.ts one.
		// 2. Remove the project path.
		// 3. Remove the leading slash.
		const originalFileName = sourceFile.
			replace( /\.ts$/, '.d.ts' ).
			replace( project, '' ).
			replace( /^\//, '' );
		const originalFilePath = resolvePath( outDirPath, originalFileName );

		return originalFilePath;
	}
}

export default bundler;

import virtual from '@rollup/plugin-virtual';
import { globby } from 'globby';
import { resolve as resolvePath } from 'pathe';
import { rollup } from 'rollup';
import dts from 'rollup-plugin-dts';
import ts from 'typescript';
import resolveOtherBundles from './rollupPlugins/resolveOtherBundles.js';

export default async function bundleTypes( {
	packageInfo,
	sourceFile,
	outputFile,
	tsConfig,
	onWarn = () => {}
} = {} ) {
	const projectPath = packageInfo.project;
	const userCompilerOptions = getUserCompilerOptions( projectPath, tsConfig );
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

	const tsFiles = await globby( 'src/**/*.{cts,mts,ts}', {
		absolute: true,
		cwd: projectPath
	} );
	const emittedFiles = {};

	const host = ts.createCompilerHost( compilerOptions );
	host.writeFile = ( filePath, contents ) => {
		const relativeFilePath = getRelativeToProjectPath( projectPath, filePath );

		emittedFiles[ relativeFilePath ] = contents;
	};

	// Prepare and emit the d.ts files
	const program = ts.createProgram( tsFiles, compilerOptions, host );

	program.emit();

	const input = getOriginalDTsFilePath( projectPath, sourceFile );
	const rollupConfig = {
		input,
		plugins: [
			virtual( emittedFiles ),

			resolveOtherBundles( projectPath, packageInfo.dist, {
				isTypeBundling: true
			} ),

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
}

function getUserCompilerOptions( project, tsConfig ) {
	if ( !tsConfig ) {
		return {};
	}

	const tsConfigFilePath = resolvePath( project, tsConfig );
	const tsConfigContent = ts.readConfigFile( tsConfigFilePath, ts.sys.readFile );
	const parsedOptions = ts.parseJsonConfigFileContent( tsConfigContent.config, ts.sys, project );

	return parsedOptions.options;
}

function getOriginalDTsFilePath( project, sourceFile ) {
	// We need the relative path to the .d.(c|m)?ts file. So:
	// 1. Get the relative path via getRelativePath().
	// 2. Replace the .(c|m)?ts extension with the .d.(c|m)?ts one.
	const tsExtensionRegex = /\.(c|m)?ts$/;
	const originalFilePath = getRelativeToProjectPath( project, sourceFile ).replace( tsExtensionRegex, '.d.$1ts' );

	return originalFilePath;
}

function getRelativeToProjectPath( project, filePath ) {
	// We need the relative path to the .d.ts file. So:
	// 1. Remove the project path.
	// 2. Remove the leading slash/backslash.
	const relativeFilePath = filePath.
		replace( project, '' ).
		replace( /^[/\\]/, '' );

	return relativeFilePath;
}

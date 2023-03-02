import { globby } from 'globby';
import { resolve as resolvePath } from 'pathe';
import { rollup } from 'rollup';
import dts from 'rollup-plugin-dts';
import virtual from '@rollup/plugin-virtual';
import ts from 'typescript';
import fixDTSImportPaths from './rollupPlugins/fixDTSImportPaths.js';

async function bundleTypes( {
	packageInfo,
	sourceFile,
	outputFile,
	tsConfig,
	onWarn = () => {}
} = {} ) {
	const project = packageInfo.project;
	const userCompilerOptions = getUserCompilerOptions( project, tsConfig );
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
		const relativeFilePath = getRelativeToProjectPath( project, filePath );

		emittedFiles[ relativeFilePath ] = contents;
	};

	// Prepare and emit the d.ts files
	const program = ts.createProgram( tsFiles, compilerOptions, host );
	program.emit();

	const input = getOriginalDTsFilePath( project, sourceFile );
	const rollupConfig = {
		input,
		plugins: [
			fixDTSImportPaths( packageInfo.dist ),

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
	// We need the relative path to the .d.ts file. So:
	// 1. Get the relative path via getRelativePath().
	// 2. Replace the .ts extension with the .d.ts one.
	const originalFilePath = getRelativeToProjectPath( project, sourceFile ).replace( /\.ts$/, '.d.ts' );

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

export default bundleTypes;

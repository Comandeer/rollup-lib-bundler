import { readFile } from 'node:fs/promises';
import { resolve as resolvePath } from 'node:path';
import { extname as getFileExtension } from 'node:path';
import { normalize as normalizePath } from 'node:path';
import validateSourcemap from 'sourcemap-validator';

/**
 * @type {import('globby').globby}
 */
let globby;

const checkStrategies = {
	'.js': checkJSFile,
	'.cjs': checkJSFile,
	'.mjs': checkJSFile,

	'.map': checkSourceMapFile
};

async function checkDistFiles( fixturePath, expectedFiles, {
	strategies = checkStrategies,
	additionalCodeChecks
} = {} ) {
	if ( !globby ) {
		const globbyModule = await import( 'globby' );
		// eslint-disable-next-line require-atomic-updates
		globby = globbyModule.globby;
	}

	const distPathRegex = /dist[/\\]?$/g;
	const distPath = distPathRegex.test( fixturePath ) ? fixturePath : resolvePath( fixturePath, 'dist' );
	const actualFiles = await globby( '**/*', {
		cwd: distPath,
		onlyFiles: true,
		absolute: true
	} );
	const normalizedActualFiles = actualFiles.map( ( file ) => {
		return normalizePath( file );
	} );

	expectedFiles = expectedFiles.map( ( file ) => {
		return resolvePath( distPath, file );
	} ).map( ( file ) => {
		return normalizePath( file );
	} );

	expect( normalizedActualFiles ).to.have.members( expectedFiles );

	/* eslint-disable no-await-in-loop */
	for ( const filePath of expectedFiles ) {
		await checkBundledContent( filePath, {
			strategies,
			additionalCodeChecks
		} );
	}
	/* eslint-enable no-await-in-loop */
}

function checkBanner( fileContent ) {
	// Yeah, I know…
	const bannerRegex = /^(?<banner>\/\*! .+? v\d+\.\d+\.\d+ \| \(c\) \d{4} .+? \| .+? license \(see LICENSE\) \*\/\n)(?!.*\k<banner>)/g;
	const match = fileContent.match( bannerRegex );

	expect( match ).to.be.an( 'array' );
	expect( match ).to.have.lengthOf( 1 );
}

async function checkJSFile( path, code, { additionalCodeChecks } ) {
	checkBanner( code );
	checkSourceMapReference( code );

	if ( typeof additionalCodeChecks === 'function' ) {
		await additionalCodeChecks( path, code );
	}
}

function checkSourceMapReference( fileContent ) {
	const sourceMapReferenceRegex = /\n\/\/# sourceMappingURL=.+?\.map\n$/g;

	expect( fileContent, 'sourcemap reference' ).to.match( sourceMapReferenceRegex );
}

async function checkSourceMapFile( path, sourcemap ) {
	const jsFilePath = path.replace( /\.map$/, '' );
	const jsCode = await readFile( jsFilePath, 'utf8' );

	validateSourcemap( jsCode, sourcemap );
}

async function checkBundledContent( path, {
	strategies = checkStrategies,
	additionalCodeChecks
} = {} ) {
	const extension = getFileExtension( path );
	const strategy = strategies[ extension ];

	if ( !strategy ) {
		return;
	}

	const code = await readFile( path, 'utf8' );

	strategy( path, code, { additionalCodeChecks } );
}

export { checkDistFiles };
export { checkBanner };
export { checkBundledContent };

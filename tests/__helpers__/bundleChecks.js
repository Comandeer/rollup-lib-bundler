import { readFile } from 'fs/promises';
import { access } from 'fs/promises';
import { resolve as resolvePath } from 'path';
import { extname as getFileExtension } from 'path';
import validateSourcemap from 'sourcemap-validator';

const checkStrategies = {
	'.js': checkJSFile,
	'.cjs': checkJSFile,
	'.mjs': checkJSFile,

	'.map': checkSourceMapFile
};

async function checkFiles( path, files, {
	strategies = checkStrategies,
	additionalCodeChecks
} = {} ) {
	/* eslint-disable no-await-in-loop */
	for ( const file of files ) {
		const filePath = resolvePath( path, file );

		await expect( access( filePath ), `File ${ filePath } exists` ).to.eventually.be.fulfilled;
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

export { checkFiles };
export { checkBanner };
export { checkBundledContent };

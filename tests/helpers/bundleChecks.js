import { readFileSync } from 'fs';
import { existsSync } from 'fs';
import { resolve as resolvePath } from 'path';
import { extname as getFileExtension } from 'path';
import { expect } from 'chai';
import validateSourcemap from 'sourcemap-validator';

const checkStrategies = {
	[ '.js' ]( path, code, { additionalCodeChecks } ) {
		checkBanner( code );
		checkSourceMapReference( code );

		if ( typeof additionalCodeChecks === 'function' ) {
			additionalCodeChecks( code );
		}
	},

	[ '.map' ]( path, sourcemap ) {
		const jsFilePath = path.replace( /\.map$/, '' );
		const jsCode = readFileSync( jsFilePath, 'utf8' );

		validateSourcemap( jsCode, sourcemap );
	}
};

function checkFiles( path, files, {
	strategies = checkStrategies,
	additionalCodeChecks
} = {} ) {
	files.forEach( ( file ) => {
		const filePath = resolvePath( path, file );

		expect( existsSync( filePath ), `File ${ filePath } exists` ).to.equal( true );
		checkBundledContent( filePath, {
			strategies,
			additionalCodeChecks
		} );
	} );
}

function checkBanner( fileContent ) {
	// Yeah, I know…
	const bannerRegex = /^(?<banner>\/\*! .+? v\d+\.\d+\.\d+ \| \(c\) \d{4} .+? \| .+? license \(see LICENSE\) \*\/\n)(?!.*\k<banner>)/g;
	const match = fileContent.match( bannerRegex );

	expect( match ).to.be.an( 'array' );
	expect( match ).to.have.lengthOf( 1 );
}

function checkSourceMapReference( fileContent ) {
	const sourceMapReferenceRegex = /\n\/\/# sourceMappingURL=.+?\.map\n$/g;

	expect( fileContent, 'sourcemap reference' ).to.match( sourceMapReferenceRegex );
}

function checkBundledContent( path, {
	strategies = checkStrategies,
	additionalCodeChecks
} = {} ) {
	const extension = getFileExtension( path );
	const strategy = strategies[ extension ];

	if ( !strategy ) {
		return;
	}

	const code = readFileSync( path, 'utf8' );

	strategy( path, code, { additionalCodeChecks } );
}

export { checkFiles };
export { checkBanner };
export { checkBundledContent };

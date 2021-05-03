import { existsSync } from 'fs';
import { readFileSync } from 'fs';

function packageParser( metadata ) {
	if ( typeof metadata === 'string' ) {
		metadata = loadAndParseFile( metadata );
	} else if ( typeof metadata !== 'object' ) {
		throw new TypeError( 'Provide string or object.' );
	}

	lintObject( metadata );

	return prepareMetadata( metadata );
}

function loadAndParseFile( path ) {
	if ( !existsSync( path ) ) {
		throw new ReferenceError( 'File with given path does not exist.' );
	}

	const contents = readFileSync( path, 'utf8' );
	let parsed;

	try {
		parsed = JSON.parse( contents );
	} catch ( e ) {
		throw new SyntaxError( 'Given file is not parsable as a correct JSON.' );
	}

	return parsed;
}

function lintObject( obj ) {
	checkProperty( 'name' );
	checkProperty( 'version' );
	checkProperty( 'main' );
	checkProperties( 'module', 'jsnext:main' );
	checkProperty( 'author' );
	checkProperty( 'license' );

	function checkProperty( name ) {
		if ( typeof obj[ name ] === 'undefined' ) {
			throw new ReferenceError( `Package metadata must contain "${ name }" property.` );
		}
	}

	function checkProperties( name1, name2 ) {
		if ( typeof obj[ name1 ] === 'undefined' && typeof obj[ name2 ] === 'undefined' ) {
			throw new ReferenceError( `Package metadata must contain either "${ name1 }" or "${ name2 }" or both properties.` );
		}
	}
}

function prepareMetadata( obj ) {
	return {
		name: obj.name,
		version: obj.version,
		author: prepareAuthorMetadata( obj.author ),
		license: obj.license,
		src: 'src/index.js',
		dist: {
			esm: obj.module || obj[ 'jsnext:main' ],
			cjs: obj.main
		}
	};
}

function prepareAuthorMetadata( author ) {
	if ( typeof author !== 'object' ) {
		return String( author );
	}

	return author.name;
}

export default packageParser;

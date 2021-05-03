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
	checkProperties( 'exports.require', 'main' );
	checkProperties( 'exports.import', 'module', 'jsnext:main' );
	checkProperty( 'author' );
	checkProperty( 'license' );

	function checkProperty( name ) {
		if ( typeof obj[ name ] === 'undefined' ) {
			throw new ReferenceError( `Package metadata must contain "${ name }" property.` );
		}
	}

	function checkProperties( ...properties ) {
		const isAtLeastOnePresent = properties.some( ( property ) => {
			const propertyPath = property.split( '.' );

			return checkPropertyExistence( obj, propertyPath );
		} );

		if ( !isAtLeastOnePresent ) {
			throw new ReferenceError( `Package metadata must contain one of ${ prepareNamesForError( properties ) } properties or all of them.` );
		}
	}

	function checkPropertyExistence( obj, propertyPath ) {
		const currentProperty = propertyPath.shift();

		if ( typeof obj[ currentProperty ] === 'undefined' ) {
			return false;
		}

		if ( propertyPath.length === 0 ) {
			return true;
		}

		return checkPropertyExistence( obj[ currentProperty ], propertyPath );
	}

	function prepareNamesForError( names ) {
		return names.map( ( name, i ) => {
			const quotedName = `"${ name }"`;

			if ( i === 0 ) {
				return quotedName;
			}

			const conjuction = ( i === names.length - 1 ) ? ' or ' : ', ';

			return `${ conjuction}${ quotedName }`;
		} ).join( '' );
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
			esm: getESMTarget( obj ),
			cjs: getCJSTarget( obj )
		}
	};
}

function prepareAuthorMetadata( author ) {
	if ( typeof author !== 'object' ) {
		return String( author );
	}

	return author.name;
}

function getESMTarget( obj ) {
	if ( obj.exports && obj.exports.import ) {
		return obj.exports.import;
	}

	return obj.module || obj[ 'jsnext:main' ];
}

function getCJSTarget( obj ) {
	if ( obj.exports && obj.exports.require ) {
		return obj.exports.require;
	}

	return obj.main;
}

export default packageParser;

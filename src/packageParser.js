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
	checkProperties( 'exports/./require', 'exports/require', 'main' );
	checkProperties( 'exports/./import', 'exports/import', 'module', 'jsnext:main' );
	checkProperty( 'author' );
	checkProperty( 'license' );

	function checkProperty( name ) {
		if ( typeof obj[ name ] === 'undefined' ) {
			throw new ReferenceError( `Package metadata must contain "${ name }" property.` );
		}
	}

	function checkProperties( ...properties ) {
		const isAtLeastOnePresent = properties.some( ( property ) => {
			const propertyPath = property.split( '/' );

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
			const formattedName = formatName( name );
			const quotedName = `"${ formattedName }"`;

			if ( i === 0 ) {
				return quotedName;
			}

			const conjuction = ( i === names.length - 1 ) ? ' or ' : ', ';

			return `${ conjuction}${ quotedName }`;
		} ).join( '' );

		function formatName( name ) {
			// Thanks to using capturing groups, the separator will be preserved
			// in the splitted string.
			const separatorRegex = /(\/)/g;
			const nameParts = name.split( separatorRegex );

			return nameParts.reduce( ( parts, part ) => {
				const lastPart = parts[ parts.length - 1 ];

				if ( part.startsWith( '.' ) && lastPart === '.' ) {
					return [ ...parts.slice( 0, -1 ), '[ \'', part ];
				}

				if ( part === '/' && lastPart.startsWith( '.' ) ) {
					return [ ...parts, '\' ].' ];
				}

				if ( part === '/' ) {
					return [ ...parts, '.' ];
				}

				return [ ...parts, part ];
			}, [] ).join( '' );
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

function getESMTarget( metadata ) {
	const exportsTarget = getExportsTarget( metadata, '.', 'import' );

	return exportsTarget || metadata.module || metadata[ 'jsnext:main' ];
}

function getCJSTarget( metadata ) {
	const exportsTarget = getExportsTarget( metadata, '.', 'require' );

	return exportsTarget || metadata.main;
}

function getExportsTarget( metadata, subpath, type ) {
	if ( !metadata.exports ) {
		return null;
	}

	const exports = metadata.exports;

	if ( exports[ subpath ] ) {
		return exports[ subpath ][ type ];
	}

	if ( !exports[ subpath ] && subpath === '.' ) {
		return exports[ type ];
	}

	return null;
}

export default packageParser;

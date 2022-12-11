import { existsSync } from 'fs';
import { readFileSync } from 'fs';
import { extname } from 'path';
import { join as joinPath } from 'path';

let globby;

async function packageParser( packageDir ) {
	if ( typeof packageDir !== 'string' ) {
		throw new TypeError( 'Provide a path to a package directory.' );
	}

	const metadata = loadAndParsePackageJSONFile( packageDir );
	lintObject( metadata );

	return prepareMetadata( packageDir, metadata );
}

function loadAndParsePackageJSONFile( dirPath ) {
	const path = joinPath( dirPath, 'package.json' );

	if ( !existsSync( path ) ) {
		throw new ReferenceError( 'The package.json does not exist in the provided location.' );
	}

	const contents = readFileSync( path, 'utf8' );
	let parsed;

	try {
		parsed = JSON.parse( contents );
	} catch ( e ) {
		throw new SyntaxError( 'The package.json file is not parsable as a correct JSON.' );
	}

	return parsed;
}

function lintObject( obj ) {
	checkProperty( 'name' );
	checkProperty( 'version' );
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

async function prepareMetadata( packageDir, metadata ) {
	return {
		name: metadata.name,
		version: metadata.version,
		author: prepareAuthorMetadata( metadata.author ),
		license: metadata.license,
		dist: await prepareDistMetadata( packageDir, metadata )
	};
}

function prepareAuthorMetadata( author ) {
	if ( typeof author !== 'object' ) {
		return String( author );
	}

	return author.name;
}

async function prepareDistMetadata( packageDir, metadata ) {
	const subpaths = getSubPaths( metadata );
	const exportMetadata = await Promise.all( subpaths.map( ( subPath ) => {
		return prepareExportMetadata( packageDir, metadata, subPath );
	} ) );

	return exportMetadata.reduce( ( targets, currentTargets ) => {
		return { ...targets, ...currentTargets };
	}, {} );
}

function getSubPaths( metadata ) {
	const exports = metadata.exports;

	if ( !exports ) {
		return [
			'.'
		];
	}

	const subpaths = Object.keys( exports ).filter( ( subpath ) => {
		return subpath.startsWith( '.' );
	} );

	if ( !subpaths.includes( '.' ) ) {
		subpaths.unshift( '.' );
	}

	return subpaths;
}

async function prepareExportMetadata( packageDir, metadata, subPath ) {
	const subPathFilePath = await getSubPathFilePath( packageDir, subPath );
	const srcPath = joinPath( 'src', subPathFilePath );
	const esmTarget = getESMTarget( metadata, subPath );
	const cjsTarget = getCJSTarget( metadata, subPath );
	const exportMetadata = {
		esm: esmTarget,
		type: getEntryPointType( srcPath )
	};

	if ( cjsTarget ) {
		exportMetadata.cjs = cjsTarget;
	}

	return {
		[ srcPath ]: exportMetadata
	};
}

async function getSubPathFilePath( packageDir, subPath ) {
	if ( !globby ) {
		const globbyModule = await import( 'globby' );
		// eslint-disable-next-line require-atomic-updates
		globby = globbyModule.globby;
	}

	const srcPath = joinPath( packageDir, 'src' );
	const subPathFileName = subPath === '.' ? 'index' : subPath;
	const subPathGlobPattern = `${ subPathFileName}.{mts,ts,mjs,js,cts,cjs}`;
	const matchedFiles = await globby( subPathGlobPattern, {
		cwd: srcPath
	} );
	const desirableEntryPoint = getEntryPoint( matchedFiles );

	return desirableEntryPoint;
}

function getEntryPoint( matchedFiles ) {
	const fileExtensions = [
		'.mts',
		'.ts',
		'.mjs',
		'.js',
		'.cts',
		'.cjs'
	];
	const orderedFiles = matchedFiles.sort( ( a, b ) => {
		const aIndex = fileExtensions.indexOf( extname( a ) );
		const bIndex = fileExtensions.indexOf( extname( b ) );

		return aIndex - bIndex;
	} );

	return orderedFiles[ 0 ];
}

function getEntryPointType( srcPath ) {
	const isTS = srcPath.toLowerCase().endsWith( 'ts' );

	return isTS ? 'ts' : 'js';
}

function getESMTarget( metadata, subPath ) {
	const exportsTarget = getExportsTarget( metadata, subPath, 'import' );

	if ( subPath === '.' ) {
		return exportsTarget || metadata.module || metadata[ 'jsnext:main' ];
	}

	return exportsTarget;
}

function getCJSTarget( metadata, subPath ) {
	const exportsTarget = getExportsTarget( metadata, subPath, 'require' );

	if ( subPath === '.' ) {
		return exportsTarget || metadata.main;
	}

	return exportsTarget;
}

function getExportsTarget( metadata, subPath, type ) {
	if ( !metadata.exports ) {
		return null;
	}

	const exports = metadata.exports;

	if ( exports[ subPath ] ) {
		return exports[ subPath ][ type ];
	}

	if ( !exports[ subPath ] && subPath === '.' ) {
		return exports[ type ];
	}

	return null;
}

export default packageParser;

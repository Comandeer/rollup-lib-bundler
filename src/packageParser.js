import { access } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import { extname } from 'pathe';
import { join as joinPath } from 'pathe';
import { normalize as normalizePath } from 'pathe';

/**
 * @type {import('globby').globby}
 */
let globby;

async function packageParser( packageDir ) {
	if ( typeof packageDir !== 'string' ) {
		throw new TypeError( 'Provide a path to a package directory.' );
	}

	const metadata = await loadAndParsePackageJSONFile( packageDir );
	lintObject( metadata );

	return prepareMetadata( packageDir, metadata );
}

async function loadAndParsePackageJSONFile( dirPath ) {
	const path = joinPath( dirPath, 'package.json' );

	try {
		await access( path );
	} catch {
		throw new ReferenceError( 'The package.json does not exist in the provided location.' );
	}

	const contents = await readFile( path, 'utf8' );
	let parsed;

	try {
		parsed = JSON.parse( contents );
	} catch ( e ) {
		throw new SyntaxError( 'The package.json file is not parsable as a correct JSON.' );
	}

	return parsed;
}

function lintObject( obj ) {
	if ( typeof obj.name === 'undefined' ) {
		throw new ReferenceError( 'Package metadata must contain "name" property.' );
	}

	if ( typeof obj.version === 'undefined' ) {
		throw new ReferenceError( 'Package metadata must contain "version" property.' );
	}

	const isESMEntryPointPresent = typeof obj.exports?.import !== 'undefined' ||
		typeof obj.exports?.[ '.' ]?.import !== 'undefined';

	if ( !isESMEntryPointPresent ) {
		throw new ReferenceError(
			'Package metadata must contain one of "exports[ \'.\' ].import" or "exports.import" properties or all of them.'
		);
	}

	if ( typeof obj.author === 'undefined' ) {
		throw new ReferenceError( 'Package metadata must contain "author" property.' );
	}

	if ( typeof obj.license === 'undefined' ) {
		throw new ReferenceError( 'Package metadata must contain "license" property.' );
	}
}

async function prepareMetadata( packageDir, metadata ) {
	const project = normalizePath( packageDir );

	return {
		project,
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
	const subPathsMetadata = await Promise.all( subpaths.map( ( subPath ) => {
		return prepareSubPathMetadata( packageDir, metadata, subPath );
	} ) );
	const distMetadata = [ ...subPathsMetadata ].reduce( ( targets, currentTargets ) => {
		return { ...targets, ...currentTargets };
	}, {} );

	return distMetadata;
}

function getSubPaths( metadata ) {
	const exports = metadata.exports;

	const subPaths = Object.keys( exports ).filter( ( subpath ) => {
		return subpath.startsWith( '.' );
	} );

	if ( !subPaths.includes( '.' ) ) {
		subPaths.unshift( '.' );
	}

	const binSubPaths = getBinSubPaths( metadata );

	subPaths.push( ...binSubPaths );

	return subPaths;
}

function getBinSubPaths( { bin, name } ) {
	if ( typeof bin === 'undefined' ) {
		return [];
	}

	if ( typeof bin === 'string' ) {
		return [
			`./__bin__/${ name }`
		];
	}

	const binSubPaths = Object.keys( bin ).map( ( bin ) => {
		return `./__bin__/${ bin }`;
	} );

	return binSubPaths;
}

async function prepareSubPathMetadata( packageDir, metadata, subPath ) {
	const subPathFilePath = await getSubPathFilePath( packageDir, subPath );
	const srcPath = joinPath( 'src', subPathFilePath );
	const esmTarget = isBinSubPath( subPath ) ?
		getBinTarget( metadata, subPath ) :
		getESMTarget( metadata, subPath );
	const cjsTarget = getCJSTarget( metadata, subPath );
	const exportType = getEntryPointType( srcPath );
	const exportMetadata = {
		esm: esmTarget,
		type: exportType
	};

	if ( cjsTarget ) {
		exportMetadata.cjs = cjsTarget;
	}

	if ( exportType === 'ts' ) {
		const typesTarget = getTypesTarget( metadata, subPath );
		const tsConfigPath = await getTSConfigPath( packageDir );

		if ( typesTarget ) {
			exportMetadata.types = typesTarget;
		}

		if ( tsConfigPath ) {
			exportMetadata.tsConfig = tsConfigPath;
		}
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

function isBinSubPath( subPath ) {
	return subPath.startsWith( './__bin__' );
}

function getESMTarget( metadata, subPath ) {
	const exportsTarget = getExportsTarget( metadata, subPath, 'import' );

	return exportsTarget;
}

function getBinTarget( { bin, name }, subPath ) {
	const subPathPrefixRegex = /^\.\/__bin__\//g;
	const binName = subPath.replace( subPathPrefixRegex, '' );

	if ( binName === name && typeof bin === 'string' ) {
		return bin;
	}

	return bin[ binName ];
}

function getCJSTarget( metadata, subPath ) {
	const exportsTarget = getExportsTarget( metadata, subPath, 'require' );

	return exportsTarget;
}

function getTypesTarget( metadata, subPath ) {
	const exportsTarget = getExportsTarget( metadata, subPath, 'types' );

	return exportsTarget;
}

function getExportsTarget( metadata, subPath, type ) {
	const exports = metadata.exports;

	if ( exports[ subPath ] ) {
		return exports[ subPath ][ type ];
	}

	if ( !exports[ subPath ] && subPath === '.' ) {
		return exports[ type ];
	}
}

async function getTSConfigPath( packageDir ) {
	const tsConfigGlobPattern = 'tsconfig?(.rlb).json';
	const matchedFiles = await globby( tsConfigGlobPattern, {
		cwd: packageDir
	} );

	if ( matchedFiles.length === 0 ) {
		return null;
	}

	const rlbSpecificPath = matchedFiles.find( ( path ) => {
		return path.endsWith( '.rlb.json' );
	} );
	const tsConfigPath = rlbSpecificPath || matchedFiles[ 0 ];

	return tsConfigPath;
}

export default packageParser;

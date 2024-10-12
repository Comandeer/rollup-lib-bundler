import { globby } from 'globby';
import { extname, join as joinPath } from 'pathe';
import { PackageJSON } from './loadAndParsePackageJSONFile.js';

export interface SubPathMetadata {
	esm: string;
	type: EntryPointType;
	isBin: boolean;
	types?: string;
	tsConfig?: string;
}

export type DistMetadata = Record<string, SubPathMetadata>;
export type EntryPointType = 'js' | 'ts';
export type ExportType = 'import' | 'types';

export async function prepareDistMetadata( packageDir: string, metadata: PackageJSON ): Promise<DistMetadata> {
	const subpaths = getSubPaths( metadata );
	const subPathsMetadata = await Promise.all( subpaths.map( ( subPath ) => {
		return prepareSubPathMetadata( packageDir, metadata, subPath );
	} ) );
	const distMetadata = [ ...subPathsMetadata ].reduce( ( targets, currentTargets ) => {
		return { ...targets, ...currentTargets };
	}, {} );

	return distMetadata;
}

function getSubPaths( metadata: PackageJSON ): Array<string> {
	const exports = metadata.exports;

	// `exports` as a string is equal to having a one subpath of `.`.
	if ( typeof exports === 'string' ) {
		return [
			'.'
		];
	}

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

function getBinSubPaths( { bin, name }: PackageJSON ): Array<string> {
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

async function prepareSubPathMetadata( packageDir, metadata, subPath ): Promise<DistMetadata> {
	const subPathFilePath = await getSubPathFilePath( packageDir, subPath );
	const srcPath = joinPath( 'src', subPathFilePath );
	const isBin = isBinSubPath( subPath );
	const esmTarget = isBin ?
		getBinTarget( metadata, subPath ) :
		getESMTarget( metadata, subPath );
	const exportType = getEntryPointType( srcPath );
	const exportMetadata: SubPathMetadata = {
		esm: esmTarget,
		type: exportType,
		isBin
	};

	if ( exportType === 'ts' ) {
		const typesTarget = getTypesTarget( metadata, subPath );
		const tsConfigPath = await getTSConfigPath( packageDir );

		if ( typesTarget ) {
			exportMetadata.types = typesTarget;
		}

		if ( tsConfigPath !== undefined ) {
			exportMetadata.tsConfig = tsConfigPath;
		}
	}

	return {
		[ srcPath ]: exportMetadata
	};
}

async function getSubPathFilePath( packageDir: string, subPath: string ): Promise<string> {
	const srcPath = joinPath( packageDir, 'src' );
	const subPathFileName = subPath === '.' ? 'index' : subPath;
	const subPathGlobPattern = `${ subPathFileName}.{mts,ts,mjs,js,cts,cjs}`;
	const matchedFiles = await globby( subPathGlobPattern, {
		cwd: srcPath
	} );
	const desirableEntryPoint = getEntryPoint( matchedFiles );

	return desirableEntryPoint;
}

function getEntryPoint( matchedFiles: Array<string> ): string {
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

	return orderedFiles[ 0 ]!;
}

function getEntryPointType( srcPath: string ): EntryPointType  {
	const isTS = srcPath.toLowerCase().endsWith( 'ts' );

	return isTS ? 'ts' : 'js';
}

function isBinSubPath( subPath: string ): boolean {
	return subPath.startsWith( './__bin__' );
}

function getESMTarget( metadata: PackageJSON, subPath: string ): string {
	const exportsTarget = getExportsTarget( metadata, subPath, 'import' )!;

	return exportsTarget;
}

function getBinTarget( { bin, name }: PackageJSON, subPath: string ): string {
	const subPathPrefixRegex = /^\.\/__bin__\//g;
	const binName = subPath.replace( subPathPrefixRegex, '' );

	if ( binName === name && typeof bin === 'string' ) {
		return bin;
	}

	return bin![ binName ];
}

function getTypesTarget( metadata: PackageJSON, subPath: string ): string {
	const exportsTarget = getExportsTarget( metadata, subPath, 'types' )!;

	return exportsTarget;
}

function getExportsTarget( metadata: PackageJSON, subPath: string, type: ExportType ): string | undefined {
	const exports = metadata.exports;

	if ( typeof exports === 'string' && subPath === '.' ) {
		return type === 'import' ? exports : undefined;
	}

	if ( typeof exports[ subPath ] === 'string' ) {
		return type === 'import' ? exports[ subPath ] : undefined;
	}

	if ( exports[ subPath ] !== undefined ) {
		return exports[ subPath ][ type ];
	}

	if ( exports[ subPath ] === undefined && subPath === '.' ) {
		return exports[ type ];
	}
}

async function getTSConfigPath( packageDir ): Promise<string | undefined> {
	const tsConfigGlobPattern = 'tsconfig?(.rlb).json';
	const matchedFiles = await globby( tsConfigGlobPattern, {
		cwd: packageDir
	} );

	if ( matchedFiles.length === 0 ) {
		return;
	}

	const rlbSpecificPath = matchedFiles.find( ( path ) => {
		return path.endsWith( '.rlb.json' );
	} );
	const tsConfigPath = rlbSpecificPath ?? matchedFiles[ 0 ];

	return tsConfigPath;
}

import { access, readFile } from 'node:fs/promises';
import { globby } from 'globby';
import { extname, join as joinPath, normalize as normalizePath } from 'pathe';
import { PackageJson } from 'type-fest';

export interface SubPathMetadata {
	esm: string;
	type: EntryPointType;
	isBin: boolean;
	types?: string;
	tsConfig?: string;
}

export type DistMetadata = Record<string, SubPathMetadata>;
type EntryPointType = 'js' | 'ts';
type ExportType = 'import' | 'types';
type SemVerString = `${ number}.${ number }.${ number }`;
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PackageMetadata {
	project: string;
	name: string;
	version: SemVerString;
	author: string;
	license: string;
	dist: DistMetadata;
}

export default async function packageParser( packageDir: string ): Promise<PackageMetadata> {
	if ( typeof packageDir !== 'string' ) {
		throw new TypeError( 'Provide a path to a package directory.' );
	}

	const metadata = await loadAndParsePackageJSONFile( packageDir );
	lintObject( metadata );

	return prepareMetadata( packageDir, metadata );
}

async function loadAndParsePackageJSONFile( dirPath: string ): Promise<PackageJson> {
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

function lintObject( obj: PackageJson ): void {
	if ( typeof obj.name === 'undefined' ) {
		throw new ReferenceError( 'Package metadata must contain "name" property.' );
	}

	if ( typeof obj.version === 'undefined' ) {
		throw new ReferenceError( 'Package metadata must contain "version" property.' );
	}

	// @ts-expect-error Seems like PackageJson type does not contain all exports variants.
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

async function prepareMetadata( packageDir, metadata: PackageJson ): Promise<PackageMetadata> {
	const project = normalizePath( packageDir );

	return {
		project,
		name: metadata.name!,
		version: metadata.version! as SemVerString,
		author: prepareAuthorMetadata( metadata.author ),
		license: metadata.license!,
		dist: await prepareDistMetadata( packageDir, metadata )
	};
}

function prepareAuthorMetadata( author: PackageJson['author'] ): string {
	if ( typeof author !== 'object' ) {
		return String( author );
	}

	return author.name;
}

async function prepareDistMetadata( packageDir: string, metadata: PackageJson ): Promise<DistMetadata> {
	const subpaths = getSubPaths( metadata );
	const subPathsMetadata = await Promise.all( subpaths.map( ( subPath ) => {
		return prepareSubPathMetadata( packageDir, metadata, subPath );
	} ) );
	const distMetadata = [ ...subPathsMetadata ].reduce( ( targets, currentTargets ) => {
		return { ...targets, ...currentTargets };
	}, {} );

	return distMetadata;
}

function getSubPaths( metadata: PackageJson ): Array<string> {
	const exports = metadata.exports!;

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

function getBinSubPaths( { bin, name }: PackageJson ): Array<string> {
	if ( typeof bin === 'undefined' ) {
		return [];
	}

	if ( typeof bin === 'string' ) {
		return [
			`./__bin__/${ name! }`
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

function getESMTarget( metadata: PackageJson, subPath: string ): string {
	const exportsTarget = getExportsTarget( metadata, subPath, 'import' )!;

	return exportsTarget;
}

function getBinTarget( { bin, name }: PackageJson, subPath: string ): string {
	const subPathPrefixRegex = /^\.\/__bin__\//g;
	const binName = subPath.replace( subPathPrefixRegex, '' );

	if ( binName === name && typeof bin === 'string' ) {
		return bin;
	}

	return bin![ binName ];
}

function getTypesTarget( metadata: PackageJson, subPath: string ): string {
	const exportsTarget = getExportsTarget( metadata, subPath, 'types' )!;

	return exportsTarget;
}

function getExportsTarget( metadata: PackageJson, subPath: string, type: ExportType ): string | undefined {
	const exports = metadata.exports!;

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

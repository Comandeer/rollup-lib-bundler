import { readFile } from 'node:fs/promises';
// eslint-disable-next-line ava/use-test
import { ExecutionContext } from 'ava';
import { globby } from 'globby';
import { resolve as resolvePath } from 'pathe';
import validateSourceMap from 'sourcemap-validator';
import checkBanner from './checkBanner.js';

export type AdditionalCodeCheckCallback = (
	t: ExecutionContext,
	path: string,
	code: string
) => Promise<void> | void;

interface CheckStrategyCallbackOptions {
	additionalCodeChecks?: Array<AdditionalCodeCheckCallback> | undefined;
}

type CheckJSFileOptions = CheckStrategyCallbackOptions;
type CheckDTSFileOptions = CheckStrategyCallbackOptions;

export type CheckStrategyCallback = (
	t: ExecutionContext,
	path: string,
	code: string,
	options?: CheckStrategyCallbackOptions
) => Promise<void> | void;

export type CheckStrategiesMap = Map<RegExp, CheckStrategyCallback>;

interface CheckBundledContentOptions {
	strategies?: CheckStrategiesMap;
	additionalCodeChecks?: Array<AdditionalCodeCheckCallback>;
}

const defaultCheckStrategies: CheckStrategiesMap = new Map( [
	[ /\.(c|m)?js$/, checkJSFile ],
	[ /\.map$/, checkSourceMapFile ],
	[ /\.d\.(c|m)?ts$/, checkDTSFile ]
] );

interface CheckDistFilesOptions {
	customCheckStrategies?: CheckStrategiesMap;
	additionalCodeChecks?: Array<AdditionalCodeCheckCallback>;
}

/**
 *
 * @param {AvaTestContext} t
 * @param {string} fixturePath
 * @param {Array<string>} expectedFiles
 * @param {CheckDistFilesOptions} options
 * @returns {Promise<void>}
 */
export default async function checkDistFiles(
	t: ExecutionContext,
	fixturePath: string,
	expectedFiles: Array<string>,
	{
		customCheckStrategies = new Map(),
		additionalCodeChecks = []
	}: CheckDistFilesOptions = {}
): Promise<void> {
	const actualFiles = await globby( '**/*', {
		cwd: fixturePath,
		onlyFiles: true,
		unique: true,
		absolute: true,
		ignore: [
			'node_modules/**',
			'package.json',
			'tsconfig.json',
			'tsconfig.rlb.json',
			'src/**/*'
		]
	} );

	actualFiles.sort();

	const expectedFilePaths = expectedFiles.map( ( file ) => {
		return resolvePath( fixturePath, file );
	} ).sort();

	t.deepEqual( actualFiles, expectedFilePaths, 'All expected files are present' );

	const strategies = prepareStrategies( defaultCheckStrategies, customCheckStrategies );
	const checkPromises = expectedFilePaths.map( ( filePath ) => {
		return checkBundledContent( t, filePath, {
			strategies,
			additionalCodeChecks
		} );
	} );

	await Promise.all( checkPromises );
}

function prepareStrategies(
	defaultCheckStrategies: CheckStrategiesMap,
	customCheckStrategies: CheckStrategiesMap
): CheckStrategiesMap {
	const customCheckStrategiesEntries = [ ...customCheckStrategies ];
	const filteredDefaultStrategies = [ ...defaultCheckStrategies ].filter( ( [ regex ] ) => {
		return !customCheckStrategiesEntries.some( ( [ customRegex ] ) => {
			return customRegex.source === regex.source;
		} );
	} );

	return new Map( [ ...filteredDefaultStrategies, ...customCheckStrategiesEntries ] );
}

async function checkBundledContent(
	t: ExecutionContext,
	path: string,
	{
		strategies = defaultCheckStrategies,
		additionalCodeChecks
	}: CheckBundledContentOptions = {}
): Promise<void> {
	const strategy = getStrategy( strategies, path );

	if ( strategy === undefined ) {
		return;
	}

	const code = await readFile( path, 'utf8' );

	return strategy( t, path, code, { additionalCodeChecks } );
}

function getStrategy( strategies: CheckStrategiesMap, path: string ): CheckStrategyCallback | undefined {
	return [ ...strategies ].find( ( [ regex ] ) => {
		return regex.test( path );
	} )?.[ 1 ];
}

async function checkJSFile( t: ExecutionContext, path: string, code: string, {
	additionalCodeChecks = []
}: CheckJSFileOptions ): Promise<void> {
	checkBanner( t, code );
	checkSourceMapReference( t, code );

	const additionalCodeChecksPromises = additionalCodeChecks.map( ( additionalCodeCheck ) => {
		return additionalCodeCheck( t, path, code );
	} );

	await Promise.all( additionalCodeChecksPromises );
}

function checkSourceMapReference( t: ExecutionContext, fileContent: string ): void {
	const sourceMapReferenceRegex = /\n\/\/# sourceMappingURL=.+?\.map\n$/g;

	t.regex( fileContent, sourceMapReferenceRegex, 'sourcemap reference' );
}

async function checkSourceMapFile( t: ExecutionContext, path: string, sourceMap: string ): Promise<void> {
	const jsFilePath = path.replace( /\.map$/, '' );
	const jsCode = await readFile( jsFilePath, 'utf8' );

	t.notThrows( () => {
		return validateSourceMap( jsCode, sourceMap );
	} );

	// Check if mappings are not empty (#105).
	const parsedSourceMap = JSON.parse( sourceMap );
	const correctMappingsRegex = /;[a-z0-9]+,/i;

	t.regex( parsedSourceMap.mappings, correctMappingsRegex, 'Mappings are not empty' );
}

async function checkDTSFile( t: ExecutionContext, path: string, code: string, {
	additionalCodeChecks = []
}: CheckDTSFileOptions ): Promise<void> {
	const additionalCodeChecksPromises = additionalCodeChecks.map( ( additionalCodeCheck ) => {
		return additionalCodeCheck( t, path, code );
	} );

	await Promise.all( additionalCodeChecksPromises );
}

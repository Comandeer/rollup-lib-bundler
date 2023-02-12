import { readFile } from 'node:fs/promises';
import { resolve as resolvePath } from 'node:path';
import { extname as getFileExtension } from 'node:path';
import { normalize as normalizePath } from 'node:path';
import validateSourceMap from 'sourcemap-validator';
import checkBanner from './checkBanner.js';

/**
 * @type {import('globby').globby}
 */
let globby;

/**
 * @callback CheckStrategyCallback
 * @param {AvaTestContext} t
 * @param {string} path
 * @param {string} code
 * @param {CheckStrategyCallbackOptions} options
 * @returns {Promise<void> | void}
 */

/**
 * @type {Record<string,CheckStrategyCallback>}
 */
const defaultCheckStrategies = {
	'.js': checkJSFile,
	'.cjs': checkJSFile,
	'.mjs': checkJSFile,

	'.map': checkSourceMapFile
};

/**
 * @typedef {import('ava').ExecutionContext<unknown>} AvaTestContext
 */

/**
 * @callback AdditionalCodeCheckCallback
 * @param {AvaTestContext} t Test execution context
 * @param {string} path
 * @param {string} code
 * @returns {Promise<void> | void}
 */

/**
 * @typedef {Object} CheckDistFilesOptions
 * @property {Record<string,CheckStrategyCallback>} [strategies={}] Allowe strategies for checking files.
 * @property {Array<AdditionalCodeCheckCallback>} [additionalCodeChecks=[]] Additional code checks to perform.
 */

/**
 *
 * @param {AvaTestContext} t
 * @param {string} fixturePath
 * @param {Array<string>} expectedFiles
 * @param {CheckDistFilesOptions} options
 * @returns {Promise<void>}
 */
async function checkDistFiles( t, fixturePath, expectedFiles, {
	customCheckStrategies = {},
	additionalCodeChecks = []
} = {} ) {
	if ( !globby ) {
		const globbyModule = await import( 'globby' );
		// eslint-disable-next-line require-atomic-updates
		globby = globbyModule.globby;
	}

	const distPathRegex = /dist[/\\]?$/g;
	const distPath = distPathRegex.test( fixturePath ) ? fixturePath : resolvePath( fixturePath, 'dist' );
	const actualFiles = await globby( '**/*', {
		cwd: distPath,
		onlyFiles: true,
		absolute: true
	} );
	const normalizedActualFiles = actualFiles.map( ( file ) => {
		return normalizePath( file );
	} );

	expectedFiles = expectedFiles.map( ( file ) => {
		return resolvePath( distPath, file );
	} ).map( ( file ) => {
		return normalizePath( file );
	} );

	t.deepEqual( normalizedActualFiles, expectedFiles );

	const strategies = { ...defaultCheckStrategies, ...customCheckStrategies };
	const checkPromises = expectedFiles.map( ( filePath ) => {
		return checkBundledContent( t, filePath, {
			strategies,
			additionalCodeChecks
		} );
	} );

	await Promise.all( checkPromises );
}

/**
 * @typedef {Object} CheckStrategyCallbackOptions
 * @property {Array<AdditionalCodeCheckCallback>} [additionalCodeChecks=[]] Additional code checks to perform.
 */

/**
 * @typedef {Object} CheckBundledContentOptions
 * @property {Record<string, CheckStrategyCallback>} [strategies=checkStrategies] Strategies for checking files.
 * @property {Array<AdditionalCodeCheckCallback>} [additionalCodeChecks=[]] Additional code checks to perform.
 */

/**
 * @param {AvaTestContext} t
 * @param {string} path
 * @param {CheckBundledContentOptions} options
 * @returns {Promise<void>}
 */
async function checkBundledContent( t, path, {
	strategies = defaultCheckStrategies,
	additionalCodeChecks
} = {} ) {
	const extension = getFileExtension( path );
	const strategy = strategies[ extension ];

	if ( !strategy ) {
		return;
	}

	const code = await readFile( path, 'utf8' );

	strategy( t, path, code, { additionalCodeChecks } );
}

/**
 * @typedef {Object} CheckJSFileOptions
 * @property {Array<AdditionalCodeCheckCallback>} [additionalCodeChecks=[]] Additional code checks to perform.
 */

/**
 *
 * @param {AvaTestContext} t
 * @param {string} path
 * @param {string} code
 * @param {CheckJSFileOptions} options
 * @returns {Promise<void>}
 */
async function checkJSFile( t, path, code, {
	additionalCodeChecks
} ) {
	checkBanner( t, code );
	checkSourceMapReference( t, code );

	const additionalCodeChecksPromises = additionalCodeChecks.map( ( additionalCodeCheck ) => {
		return additionalCodeCheck( t, path, code );
	} );

	return Promise.all( additionalCodeChecksPromises );
}

/**
 * @param {AvaTestContext} t
 * @param {string} fileContent
 * @returns {void}
 */
function checkSourceMapReference( t, fileContent ) {
	const sourceMapReferenceRegex = /\n\/\/# sourceMappingURL=.+?\.map\n$/g;

	t.regex( fileContent, sourceMapReferenceRegex, 'sourcemap reference' );
}

/**
 * @param {AvaTestContext} t
 * @param {string} path
 * @param {string} sourceMap
 * @returns {Promise<void>}
 */
async function checkSourceMapFile( t, path, sourceMap ) {
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

export default checkDistFiles;

import { execa } from 'execa';
import { resolve as resolvePath } from 'pathe';
import test from 'ava';
import checkDistFiles from '../checkDistFiles.js';
import createTemporaryFixtureDirectory from '../createTemporaryFixtureDirectory.js';
import getDirName from '../../../src/utils/getDirName.js';

const __dirname = getDirName( import.meta.url );
const BIN_PATH = resolvePath( __dirname, '..', '..', '..', 'bin', 'rlb.mjs' );

/**
 * @typedef {import('../checkDistFiles').AdditionalCodeCheckCallback} AdditionalCodeCheckCallback
 */

/**
 * @callback TestCLIBeforeCallback
 * @param {import('ava').ExecutionContext<unknown>} t Test execution context
 * @param {string} tempDirPath
 * @returns {Promise<void> | void}
 */

/**
 * @callback TestCLIAfterCallback
 * @param {import('ava').ExecutionContext<unknown>} t Test execution context
 * @param {string} tempDirPath
 * @returns {Promise<void> | void}
 */

/**
 * @callback TestCLICallback
 * @param {import('ava').ExecutionContext<unknown>} t Test execution context
 * @param {ChildProcessResult} results
 * @returns {Promise<void> | void}
 */

/**
 * @typedef {Object} TestCLIOptions
 * @property {TestCLIBeforeCallback} [before] Callback to be executed before the command.
 * @property {TestCLIAfterCallback} [after] Callback to be executed after the command.
 * @property {string} [cliPath=<path to rlb binary>] CLI to be executed;
 * @property {Array<string>} [params=[]] Command's parameters.
 * @property {string} [fixture='testPackage'] Fixture's name.
 * @property {Record<string, string>} [env={}] Additional environment variables to pass to the command.
 * @property {Array<TestCLICallback>} [cmdResultChecks=[]] Callbacks to check the command's result.
 * @property {Array<string> | undefined} [expectedFiles] Expected files in the dist directory.
 * @property {Map<RegExp,import('../checkDistFiles.js').CheckStrategyCallback>} [customCheckStrategies=new Map()] Custom check strategies.
 * @property {Array<AdditionalCodeCheckCallback>} [additionalCodeChecks=[]] Additional code checks to perform.
 */

/**
 * @param {TestCLIOptions} options
 * @returns {Promise<void>}
 */
const testCLI = test.macro( async ( t, {
	before,
	after,
	cliPath = BIN_PATH,
	params = [],
	fixture = 'testPackage',
	env = {},
	cmdResultChecks = [],
	expectedFiles,
	customCheckStrategies = new Map(),
	additionalCodeChecks = []
} = {} ) => {
	return createTemporaryFixtureDirectory( t, fixture, async ( t, tempDirPath ) => {
		if ( typeof before === 'function' ) {
			await before( t, tempDirPath );
		}

		const cmdResult = await execa( 'node', [
			cliPath,
			...params
		], {
			cwd: tempDirPath,
			env,
			reject: true
		} );

		const cmdResultChecksPromises = cmdResultChecks.map( ( cmdResultCheck ) => {
			return cmdResultCheck( t, cmdResult );
		} );

		await cmdResultChecksPromises;

		if ( Array.isArray( expectedFiles ) ) {
			await checkDistFiles( t, tempDirPath, expectedFiles, {
				customCheckStrategies,
				additionalCodeChecks
			} );
		}

		if ( typeof after === 'function' ) {
			await after( t, tempDirPath );
		}
	} );
} );

export default testCLI;

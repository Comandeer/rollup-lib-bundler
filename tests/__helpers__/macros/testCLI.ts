import { type Result, execa } from 'execa';
import { resolve as resolvePath } from 'pathe';
import test, { type ExecutionContext } from 'ava';
import { checkDistFiles, type AdditionalCodeCheckCallback, type CheckStrategiesMap } from '../checkDistFiles.js';
import { createTemporaryFixtureDirectory } from '../createTemporaryFixtureDirectory.js';

const BIN_PATH = resolvePath( import.meta.dirname, '..', '..', '..', 'src', '__bin__', 'rlb.mts' );

type TestCLIBeforeCallback = ( t: ExecutionContext, tempDirPath: string ) => Promise<void> | void;
type TestCLIAfterCallback = TestCLIBeforeCallback;
type TestCLICallback = ( t: ExecutionContext, results: Result ) => Promise<void> | void;

interface TestCLIOptions {
	before?: TestCLIBeforeCallback;
	after?: TestCLIAfterCallback;
	cliPath?: string;
	params?: Array<string>;
	fixture?: string;
	env?: Record<string, string>;
	cmdResultChecks?: Array<TestCLICallback>;
	expectedFiles?: Array<string>;
	customCheckStrategies?: CheckStrategiesMap | undefined;
	additionalCodeChecks?: Array<AdditionalCodeCheckCallback>;
}

/**
 * @param {TestCLIOptions} options
 * @returns {Promise<void>}
 */
export const testCLI = test.macro( async ( t: ExecutionContext, {
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
}: TestCLIOptions = {} ) => {
	return createTemporaryFixtureDirectory( t, fixture, async ( t, tempDirPath ) => {
		if ( typeof before === 'function' ) {
			await before( t, tempDirPath );
		}

		const cmdResult = await execa( 'tsx', [
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

		await Promise.all( cmdResultChecksPromises );

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

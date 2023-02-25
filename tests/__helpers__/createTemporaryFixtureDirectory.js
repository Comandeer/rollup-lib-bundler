import { cp } from 'node:fs/promises';
import { resolve as resolvePath } from 'pathe';
import getDirName from './getDirName';

const __dirname = getDirName( import.meta.url );
const FIXTURES_PATH = resolvePath( __dirname, '..', '__fixtures__' );

/**
 * @type {import('tempy').temporaryDirectoryTask}
 */
let tempy;

/**
 * @callback TemporaryFixtureDirectoryCallback
 * @param {import('ava').ExecutionContext<unknown>} t Test execution context
 * @param {string} tempDirPath
 * @returns {Promise<void> | void}
 */

/**
 * @param {import('ava').ExecutionContext<unknown>} t Test execution context
 * @param {string} fixture Fixture's name.
 * @param {TemporaryFixtureDirectoryCallback} callback
 * @returns {Promise<void>}
 */
async function createTemporaryFixtureDirectory( t, fixture, callback ) {
	if ( !tempy ) {
		const tempyModule = await import( 'tempy' );

		tempy = tempyModule.temporaryDirectoryTask; // eslint-disable-line require-atomic-updates
	}

	return tempy( async ( tempDirPath ) => {
		const fixturePath = resolvePath( FIXTURES_PATH, fixture );

		await cp( fixturePath, tempDirPath, {
			recursive: true
		} );

		await callback( t, tempDirPath );
	} );
}

export default createTemporaryFixtureDirectory;

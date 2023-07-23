import { cp } from 'node:fs/promises';
// eslint-disable-next-line ava/use-test
import { ExecutionContext } from 'ava';
import { resolve as resolvePath } from 'pathe';
import { temporaryDirectoryTask as tempy } from 'tempy';
import getDirName from '../../src/utils/getDirName.js';

const __dirname = getDirName( import.meta.url );
const FIXTURES_PATH = resolvePath( __dirname, '..', '__fixtures__' );

type TemporaryFixtureDirectoryCallback = ( t: ExecutionContext, tempDirPath: string ) => Promise<void> | void;

export default async function createTemporaryFixtureDirectory(
	t: ExecutionContext,
	fixture: string,
	callback: TemporaryFixtureDirectoryCallback
): Promise<void> {
	return tempy( async ( tempDirPath ) => {
		const fixturePath = resolvePath( FIXTURES_PATH, fixture );

		await cp( fixturePath, tempDirPath, {
			recursive: true
		} );

		await callback( t, tempDirPath );
	} );
}

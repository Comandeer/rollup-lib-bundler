import { cp } from 'node:fs/promises';
import type { ExecutionContext } from 'ava';
import { resolve as resolvePath } from 'pathe';
import { temporaryDirectoryTask as tempy } from 'tempy';

const FIXTURES_PATH = resolvePath( import.meta.dirname, '..', '__fixtures__' );

type TemporaryFixtureDirectoryCallback = ( t: ExecutionContext, tempDirPath: string ) => Promise<void> | void;

export async function createTemporaryFixtureDirectory(
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

import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'ava';
import getDirName from '../../src/utils/getDirName.js';

test( 'getDirName() returns the directory name from the provided URL', ( t ) => {
	const filePath = '/some/path/to/a/file.ts';
	const expectedDirName = dirname( filePath );
	const pathURL = pathToFileURL( filePath );
	const actualDirName = getDirName( pathURL );

	t.is( actualDirName, expectedDirName );
} );

import { pathToFileURL } from 'node:url';
import { dirname } from 'pathe';
import test from 'ava';
import getDirName from '../../src/utils/getDirName.js';

test( 'getDirName() returns the directory name from the provided URL', ( t ) => {
	const filePath = '/some/path/to/a/file.ts';
	const expectedDirName = dirname( filePath );
	const pathURL = pathToFileURL( filePath );
	const actualDirName = getDirName( pathURL );

	// I love Windows
	const diskLetterRegex = /^[A-Z]:/g;
	const normalizedActualDirName = actualDirName.replace( diskLetterRegex, '' );

	t.is( normalizedActualDirName, expectedDirName );
} );

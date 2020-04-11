import { resolve as resolvePath } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { sync as rimraf } from 'rimraf';
import createFixtureTest from './helpers/createFixtureTest.js';

const execPromise = promisify( exec );
const binPath = resolvePath( __dirname, '../bin/bundler' );
const fixturePath = resolvePath( __dirname, 'fixtures/testPackage' );
const outputPath = resolvePath( fixturePath, 'dist' );

describe( 'CLI', () => {
	before( () => {
		rimraf( outputPath );
	} );

	after( () => {
		rimraf( outputPath );
	} );

	it( 'bundles files based on current working directory', createFixtureTest( {
		cmd: () => {
			return execPromise( `node ${ binPath }`, { cwd: fixturePath } );
		},
		expected: [
			resolvePath( outputPath, 'es5.js' ),
			resolvePath( outputPath, 'es5.js.map' ),
			resolvePath( outputPath, 'es2015.js' ),
			resolvePath( outputPath, 'es2015.js.map' )
		]
	} ) );
} );

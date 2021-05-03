import { resolve as resolvePath } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import removeArtifacts from './helpers/removeArtifacts.js';
import createFixtureTest from './helpers/createFixtureTest.js';

const execPromise = promisify( exec );
const binPath = resolvePath( __dirname, '..', 'bin', 'bundler' );
const fixturesPath = resolvePath( __dirname, 'fixtures' );
const basicFixturePath = resolvePath( fixturesPath, 'testPackage' );
const jsonFixturePath = resolvePath( fixturesPath, 'jsonPackage' );
const exportsFixturePath = resolvePath( fixturesPath, 'exportsPackage' );

describe( 'CLI', () => {
	before( () => {
		removeArtifacts( fixturesPath );
	} );

	after( () => {
		removeArtifacts( fixturesPath );
	} );

	it( 'bundles files based on current working directory', createCLITest( basicFixturePath ) );

	// #155
	it( 'bundles package that imports JSON content', createCLITest( jsonFixturePath, {
		additionalCodeChecks( code ) {
			const regex = /name:\s?["']Piotr Kowalski["']/;

			expect( code ).to.match( regex );
		}
	} ) );

	// #61
	it( 'bundles package based on exports fields', createCLITest( exportsFixturePath ) );
} );

function createCLITest( fixturePath, { additionalCodeChecks } = {} ) {
	const outputPath = resolvePath( fixturePath, 'dist' );

	return createFixtureTest( {
		cmd: () => {
			return execPromise( `node ${ binPath }`, { cwd: fixturePath } );
		},
		path: fixturePath,
		expected: [
			resolvePath( outputPath, 'es5.js' ),
			resolvePath( outputPath, 'es5.js.map' ),
			resolvePath( outputPath, 'es2015.js' ),
			resolvePath( outputPath, 'es2015.js.map' )
		],
		additionalCodeChecks
	} );
}

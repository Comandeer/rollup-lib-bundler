import { resolve as resolvePath } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import removeArtifacts from './__helpers__/removeArtifacts.js';
import createFixtureTest from './__helpers__/createFixtureTest.js';

const execPromise = promisify( exec );
const binPath = resolvePath( __dirname, '..', 'bin', 'bundler' );
const fixturesPath = resolvePath( __dirname, '__fixtures__' );
const basicFixturePath = resolvePath( fixturesPath, 'testPackage' );
const jsonFixturePath = resolvePath( fixturesPath, 'jsonPackage' );
const exportsFixturePath = resolvePath( fixturesPath, 'exportsPackage' );
const subExportsFixturePath = resolvePath( fixturesPath, 'subExportsPackage' );
const errorFixturePath = resolvePath( fixturesPath, 'errorPackage' );

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
		additionalCodeChecks( path, code ) {
			const regex = /name:\s?["']Piotr Kowalski["']/;

			expect( code ).to.match( regex );
		}
	} ) );

	// #61
	it( 'bundles package based on exports fields', createCLITest( exportsFixturePath ) );

	// #185
	it( 'bundles package based on subexports fields', () => {
		const outputPath = resolvePath( subExportsFixturePath, 'dist' );

		return createCLITest( subExportsFixturePath, {
			expected: [
				resolvePath( outputPath, 'es5.cjs' ),
				resolvePath( outputPath, 'es6.mjs' ),
				resolvePath( outputPath, 'not-related-name.cjs' ),
				resolvePath( outputPath, 'also-not-related-name.js' )
			]
		} )(); // createCLITest() creates a test function, so it needs to be called.
	} );

	// #193
	it( 'displays output for valid package', createCLITest( basicFixturePath, {
		performFileCheck: false,
		cmdResultCheck: ( { stdout, stderr } ) => {
			expect( stdout ).to.include( 'Bundling complete!' );
			expect( stderr ).to.equal( '' );
		}
	} ) );

	// #156
	it( 'displays error for invalid package', createCLITest( errorFixturePath, {
		performFileCheck: false,
		cmdResultCheck: ( { stdout, stderr } ) => {
			expect( stdout ).to.include( 'Bundling failed!' );
			expect( stderr ).to.include( '🚨Error🚨' );
		}
	} ) );
} );

function createCLITest( fixturePath, options = {} ) {
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
		...options
	} );
}

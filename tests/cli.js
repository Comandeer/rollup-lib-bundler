import { resolve as resolvePath } from 'path';
import { existsSync } from 'fs';
import { promises as fsPromises } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import removeArtifacts from './__helpers__/removeArtifacts.js';
import createFixtureTest from './__helpers__/createFixtureTest.js';

const { mkdir, writeFile } = fsPromises;

const execPromise = promisify( exec );
const binPath = resolvePath( __dirname, '..', 'bin', 'bundler' );
const fixturesPath = resolvePath( __dirname, '__fixtures__' );
const basicFixturePath = resolvePath( fixturesPath, 'testPackage' );
const jsonFixturePath = resolvePath( fixturesPath, 'jsonPackage' );
const exportsFixturePath = resolvePath( fixturesPath, 'exportsPackage' );
const subPathExportsFixturePath = resolvePath( fixturesPath, 'subPathExportsPackage' );
const noCJSPackageFixturePath = resolvePath( fixturesPath, 'noCJSPackage' );
const noCJSSubPathExportsFixturePath = resolvePath( fixturesPath, 'noCJSSubPathExportsPackage' );
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
	it( 'bundles package based on subpath exports fields', () => {
		const outputPath = resolvePath( subPathExportsFixturePath, 'dist' );

		return createCLITest( subPathExportsFixturePath, {
			expected: [
				resolvePath( outputPath, 'es5.cjs' ),
				resolvePath( outputPath, 'es5.cjs.map' ),
				resolvePath( outputPath, 'es6.mjs' ),
				resolvePath( outputPath, 'es6.mjs.map' ),
				resolvePath( outputPath, 'not-related-name.cjs' ),
				resolvePath( outputPath, 'not-related-name.cjs.map' ),
				resolvePath( outputPath, 'also-not-related-name.js' ),
				resolvePath( outputPath, 'also-not-related-name.js.map' )
			],
			additionalCodeChecks( path, code ) {
				const isChunk = path.includes( 'related-name' );
				const expectedString = `console.log("${ isChunk ? 'chunk' : 'index' }");`;

				expect( code ).to.include( expectedString );
			}
		} )(); // createCLITest() creates a test function, so it needs to be called.
	} );

	// #215
	it( 'bundles ESM-only package based on exports fields', () => {
		const outputPath = resolvePath( noCJSPackageFixturePath, 'dist' );

		return createCLITest( noCJSPackageFixturePath, {
			expected: [
				resolvePath( outputPath, 'package.mjs' ),
				resolvePath( outputPath, 'package.mjs.map' )
			]
		} )(); // createCLITest() creates a test function, so it needs to be called.
	} );

	// #215
	it( 'bundles ESM-only package based on subpath exports fields', () => {
		const outputPath = resolvePath( noCJSSubPathExportsFixturePath, 'dist' );

		return createCLITest( noCJSSubPathExportsFixturePath, {
			expected: [
				resolvePath( outputPath, 'es6.mjs' ),
				resolvePath( outputPath, 'es6.mjs.map' ),
				resolvePath( outputPath, 'also-not-related-name.js' ),
				resolvePath( outputPath, 'also-not-related-name.js.map' )
			],
			additionalCodeChecks( path, code ) {
				const isChunk = path.includes( 'related-name' );
				const expectedString = `console.log("${ isChunk ? 'chunk' : 'index' }");`;

				expect( code ).to.include( expectedString );
			}
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

	// #204
	it( 'cleans dist directory before bundling', async () => {
		const dummyFilePath = await createDummyDist( basicFixturePath );
		await createCLITest( basicFixturePath )();

		const isDummyFileAlive = existsSync( dummyFilePath );

		expect( isDummyFileAlive ).to.equal( false );
	} );
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

async function createDummyDist( packagePath ) {
	const distPath = resolvePath( packagePath, 'dist' );
	const dummyFilePath = resolvePath( distPath, 'dummy.js' );

	// If creating the dir fails, it's most probably already there.
	try {
		await mkdir( distPath );
	} catch {
		// Just silent the error;
	}

	await writeFile( dummyFilePath, 'hublabubla', 'utf-8' );

	return dummyFilePath;
}

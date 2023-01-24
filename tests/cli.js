import { exec } from 'node:child_process';
import { access } from 'node:fs/promises';
import { mkdir } from 'node:fs/promises';
import { writeFile } from 'node:fs/promises';
import { resolve as resolvePath } from 'node:path';
import { promisify } from 'node:util';
import removeArtifacts from './__helpers__/removeArtifacts.js';
import createFixtureTest from './__helpers__/createFixtureTest.js';

const execPromise = promisify( exec );
const binPath = resolvePath( __dirname, '..', 'bin', 'bundler' );
const fixturesPath = resolvePath( __dirname, '__fixtures__' );
const basicFixturePath = resolvePath( fixturesPath, 'testPackage' );
const jsonFixturePath = resolvePath( fixturesPath, 'jsonPackage' );
const exportsFixturePath = resolvePath( fixturesPath, 'exportsPackage' );
const subPathExportsFixturePath = resolvePath( fixturesPath, 'subPathExportsPackage' );
const noCJSPackageFixturePath = resolvePath( fixturesPath, 'noCJSPackage' );
const noCJSSubPathExportsFixturePath = resolvePath( fixturesPath, 'noCJSSubPathExportsPackage' );
const tsFixturePath = resolvePath( fixturesPath, 'tsPackage' );
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
		return createCLITest( subPathExportsFixturePath, {
			expected: [
				'es5.cjs',
				'es5.cjs.map',
				'es6.mjs',
				'es6.mjs.map',
				'not-related-name.cjs',
				'not-related-name.cjs.map',
				'also-not-related-name.js',
				'also-not-related-name.js.map'
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
		return createCLITest( noCJSPackageFixturePath, {
			expected: [
				'package.mjs',
				'package.mjs.map'
			],
			cmdResultCheck( { stderr } ) {
				expect( stderr ).not.to.include( 'Bundling failed!' );
				expect( stderr ).not.to.include( '🚨Error🚨' );
				expect( stderr ).to.include( 'Skipping CJS build for' );
			}
		} )(); // createCLITest() creates a test function, so it needs to be called.
	} );

	// #215
	it( 'bundles ESM-only package based on subpath exports fields', () => {
		return createCLITest( noCJSSubPathExportsFixturePath, {
			expected: [
				'es6.mjs',
				'es6.mjs.map',
				'also-not-related-name.js',
				'also-not-related-name.js.map'
			],
			additionalCodeChecks( path, code ) {
				const isChunk = path.includes( 'related-name' );
				const expectedString = `console.log("${ isChunk ? 'chunk' : 'index' }");`;

				expect( code ).to.include( expectedString );
			},
			cmdResultCheck( { stderr } ) {
				expect( stderr ).not.to.include( 'Bundling failed!' );
				expect( stderr ).not.to.include( '🚨Error🚨' );
				expect( stderr ).to.include( 'Skipping CJS build for' );
			}
		} )(); // createCLITest() creates a test function, so it needs to be called.
	} );

	// #220, #237
	it( 'bundles TypeScript package', () => {
		return createCLITest( tsFixturePath, {
			expected: [
				'index.cjs',
				'index.cjs.map',
				'index.d.ts',
				'index.mjs',
				'index.mjs.map',
				'chunk.cjs',
				'chunk.cjs.map',
				'chunk.mjs',
				'chunk.mjs.map'
			],
			cmdResultCheck( { stderr } ) {
				expect( stderr ).not.to.include( 'Bundling failed!' );
				expect( stderr ).not.to.include( '🚨Error🚨' );
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

		await expect( access( dummyFilePath ) ).to.eventually.be.rejected;
	} );
} );

function createCLITest( fixturePath, options = {} ) {
	return createFixtureTest( {
		cmd: () => {
			return execPromise( `node ${ binPath }`, { cwd: fixturePath } );
		},
		path: fixturePath,
		expected: [
			'es5.js',
			'es5.js.map',
			'es2015.js',
			'es2015.js.map'
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

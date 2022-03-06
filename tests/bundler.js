import { readFileSync } from 'fs';
import { resolve as resolvePath } from 'path';
import removeArtifacts from './__helpers__/removeArtifacts.js';
import { checkFiles } from './__helpers__/bundleChecks.js';
import { checkBanner } from './__helpers__/bundleChecks.js';
import createFlowTest from './__helpers__/createFlowTest.js';
import bundler from '../src/bundler.js';

const metadata = {
	name: 'test-package',
	author: 'Comandeer',
	license: 'MIT',
	version: '9.0.1'
};
const fixturesPath = resolvePath( __dirname, '__fixtures__' );
const testPackageFixture = resolvePath( fixturesPath, 'testPackage' );
const subPathExportsFixture = resolvePath( fixturesPath, 'subPathExportsPackage' );

describe( 'bundler', () => {
	let sandbox;

	before( () => {
		sandbox = sinon.createSandbox();

		removeArtifacts( fixturesPath );
	} );

	after( () => {
		sandbox.restore();
		removeArtifacts( fixturesPath );
	} );

	it( 'is a function', () => {
		expect( bundler ).to.be.a( 'function' );
	} );

	it( 'bundles files based on passed metadata', async () => {
		const packageInfo = createPackageInfo();

		await bundler( {
			packageInfo
		} );

		checkFiles( testPackageFixture, [
			'dist/es5.js',
			'dist/es5.js.map',
			'dist/es2015.js',
			'dist/es2015.js.map'
		] );
	} );

	// #185
	it( 'bundles files based on passed metadata with several chunks metadata', async () => {
		const srcPath = resolvePath( subPathExportsFixture, 'src' );
		const distPath = resolvePath( subPathExportsFixture, 'dist' );
		const indexPath = resolvePath( srcPath, 'index.js' );
		const chunkPath = resolvePath( srcPath, 'chunk.js' );
		const packageInfo = createPackageInfo( subPathExportsFixture, {
			[ indexPath ]: {
				cjs: resolvePath( distPath, 'es5.cjs' ),
				esm: resolvePath( distPath, 'es6.mjs' )
			},
			[ chunkPath ]: {
				cjs: resolvePath( distPath, 'not-related-name.cjs' ),
				esm: resolvePath( distPath, 'also-not-related-name.js' )
			}
		} );

		await bundler( {
			packageInfo
		} );

		checkFiles( subPathExportsFixture, [
			'dist/es5.cjs',
			'dist/es5.cjs.map',
			'dist/es6.mjs',
			'dist/es6.mjs.map',
			'dist/not-related-name.cjs',
			'dist/not-related-name.cjs.map',
			'dist/also-not-related-name.js',
			'dist/also-not-related-name.js.map'
		] );
	} );

	it( 'produces correct banner', async () => {
		const packageInfo = createPackageInfo();

		await bundler( {
			packageInfo
		} );

		const distPath = resolvePath( testPackageFixture, 'dist' );
		const cjsPath = resolvePath( distPath, 'es5.js' );
		const esmPath = resolvePath( distPath, 'es2015.js' );
		const cjsCode = readFileSync( cjsPath, 'utf8' );
		const esmCode = readFileSync( esmPath, 'utf8' );

		checkBanner( cjsCode );
		checkBanner( esmCode );
	} );

	// #185
	it( 'produces correct banner in chunk', async () => {
		const srcPath = resolvePath( subPathExportsFixture, 'src' );
		const distPath = resolvePath( subPathExportsFixture, 'dist' );
		const indexPath = resolvePath( srcPath, 'index.js' );
		const chunkPath = resolvePath( srcPath, 'chunk.js' );
		const packageInfo = createPackageInfo( subPathExportsFixture, {
			[ indexPath ]: {
				cjs: resolvePath( distPath, 'es5.cjs' ),
				esm: resolvePath( distPath, 'es6.mjs' )
			},
			[ chunkPath ]: {
				cjs: resolvePath( distPath, 'not-related-name.cjs' ),
				esm: resolvePath( distPath, 'also-not-related-name.js' )
			}
		} );

		await bundler( {
			packageInfo
		} );

		const cjsPath = resolvePath( distPath, 'not-related-name.cjs' );
		const esmPath = resolvePath( distPath, 'also-not-related-name.js' );
		const cjsCode = readFileSync( cjsPath, 'utf8' );
		const esmCode = readFileSync( esmPath, 'utf8' );

		checkBanner( cjsCode );
		checkBanner( esmCode );
	} );

	// #67, #78
	// This test seems like it tests implementation – and that's right…
	// Yet I didn't find any other _sensible_ way to test if code is passed
	// through all necessary transformations in correct order.
	it( 'passes code through specified plugins in correct order', createFlowTest( {
		packageInfo: createPackageInfo(),
		plugins: {
			'@rollup/plugin-commonjs': 'default',
			'@rollup/plugin-json': 'default',
			'@rollup/plugin-babel': 'default',
			'rollup-plugin-terser': 'terser'
		}
	} ) );

	// #105
	it( 'generates non-empty sourcemap', async () => {
		const packageInfo = createPackageInfo();

		await bundler( {
			packageInfo
		} );

		const distPath = resolvePath( testPackageFixture, 'dist' );
		const correctMappingsRegex = /;[a-z0-9]+,/i;

		const mapES5Path = resolvePath( distPath, 'es5.js.map' );
		const mapES2015Path = resolvePath( distPath, 'es2015.js.map' );
		const mapES5 = JSON.parse( readFileSync( mapES5Path, 'utf8' ) );
		const mapES2015 = JSON.parse( readFileSync( mapES2015Path, 'utf8' ) );

		expect( mapES5.mappings ).to.match( correctMappingsRegex );
		expect( mapES2015.mappings ).to.match( correctMappingsRegex );
	} );

	// #155
	it( 'should load JSON file', async () => {
		const packageInfo = createPackageInfo( 'jsonPackage' );

		// Thrown error will fail the test.
		await bundler( {
			packageInfo
		} );

		const distPath = resolvePath( fixturesPath, 'jsonPackage', 'dist' );

		checkFiles( distPath, [
			'es5.js',
			'es5.js.map',
			'es2015.js',
			'es2015.js.map'
		], { additionalCodeChecks } );

		function additionalCodeChecks( path, code ) {
			const regex = /name:\s?["']Piotr Kowalski["']/;

			expect( code ).to.match( regex );
		}
	} );

	// #156
	it( 'throws error when any error is encountered', async () => {
		const packageInfo = createPackageInfo( 'errorPackage' );

		try {
			await bundler( {
				packageInfo
			} );
		} catch {
			return;
		}

		expect.fail( 'Error was not thrown' );
	} );

	// #193
	it( 'handle warnings', async () => {
		const packageInfo = createPackageInfo( 'externalDepPackage' );
		const onWarnSpy = sandbox.spy();

		await bundler( {
			packageInfo,
			onWarn: onWarnSpy
		} );

		expect( onWarnSpy ).to.have.been.called;
	} );
} );

function createPackageInfo( packageName = 'testPackage', distMetadata = {} ) {
	const packagePath = resolvePath( fixturesPath, packageName );
	const indexPath = resolvePath( packagePath, 'src', 'index.js' );

	return Object.assign( {}, metadata, {
		dist: {
			// Full path needs to be used here. Otherwise all tests would
			// have to be run in appropriate CWD.
			[ indexPath ]: {
				esm: resolvePath( packagePath, 'dist', 'es2015.js' ),
				cjs: resolvePath( packagePath, 'dist', 'es5.js' )
			},
			...distMetadata
		}
	} );
}

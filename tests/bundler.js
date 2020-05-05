
import { existsSync } from 'fs';
import { readFileSync } from 'fs';
import { sync as rimraf } from 'rimraf';
import { use } from 'chai';
import { expect } from 'chai';
import { noCallThru } from 'proxyquire';
import { spy } from 'sinon';
import { stub } from 'sinon';
import sinonChai from 'sinon-chai';
import bundler from '../src/bundler.js';
import { node as nodeTarget } from '../src/targets.js';

const proxyquire = noCallThru();
use( sinonChai );

const metadata = {
	name: 'test-package',
	author: 'Comandeer',
	license: 'MIT',
	version: '9.0.1'
};
const bundlerConfig = ( packageName = 'testPackage' ) => {
	return Object.assign( {}, metadata, {
		src: `tests/fixtures/${packageName}/src/index.js`,
		dist: {
			esm: `tests/fixtures/${packageName}/dist/es2015.js`,
			cjs: `tests/fixtures/${packageName}/dist/es5.js`
		}
	} );
};

xdescribe( 'bundler/testPackage', () => {
	before( () => {
		rimraf( 'tests/fixtures/testPackage/dist' );
	} );

	after( () => {
		rimraf( 'tests/fixtures/testPackage/dist' );
	} );

	it( 'is a function', () => {
		expect( bundler ).to.be.a( 'function' );
	} );

	it( 'bundles files based on passed metadata', () => {
		return bundler( bundlerConfig() ).then( () => {
			checkFiles( [
				'tests/fixtures/testPackage/dist/es5.js',
				'tests/fixtures/testPackage/dist/es5.js.map',
				'tests/fixtures/testPackage/dist/es2015.js',
				'tests/fixtures/testPackage/dist/es2015.js.map'
			] );
		} );
	} );

	it( 'produces correct banner', () => {
		return bundler( bundlerConfig() ).then( () => {
			checkBanner( 'tests/fixtures/testPackage/dist/es5.js' );
			checkBanner( 'tests/fixtures/testPackage/dist/es2015.js' );
		} );
	} );

	// #58
	it( 'does not emit warning about deprecated options', () => {
		const consoleSpy = spy( console, 'warn' );

		return bundler( bundlerConfig() ).then( () => {
			consoleSpy.restore();

			expect( consoleSpy.callCount ).to.equal( 0 );
		} );
	} );

	// #67, #78
	it( 'passes code through specified plugins in correct order', () => {
		const commonJSStub = stub().returns( {
			name: 'commonjs'
		} );
		const babelStub = stub().returns( {
			name: 'babel'
		} );
		const jsonStub = stub().returns( {
			name: 'json'
		} );
		const terserStub = stub().returns( {
			name: 'terser'
		} );
		const presetStub = {
			name: '@babel/preset-env'
		};
		const banner = 'This is banner';
		const generateBannerStub = stub().returns( banner );
		const rollupStub = stub().returns( {
			write() {}
		} );
		const config = {
			commonjs: undefined,

			json: undefined,

			babel: {
				babelrc: false,
				presets: [
					[
						presetStub,

						{
							targets: {
								node: nodeTarget
							}
						}
					]
				]
			},

			'terser': undefined
		};

		function checkCalls( name, calls ) {
			calls.forEach( ( call ) => {
				expect( call.args[ 0 ] ).to.deep.equal( config[ name ] );
			} );
		}

		function checkPlugins( { plugins } ) {
			expect( plugins ).to.be.an( 'array' );
			expect( plugins ).to.have.lengthOf( 4 );

			expect( plugins[ 0 ].name ).to.equal( 'commonjs' );
			expect( plugins[ 1 ].name ).to.equal( 'json' );
			expect( plugins[ 2 ].name ).to.equal( 'babel' );
			expect( plugins[ 3 ].name ).to.equal( 'terser' );
		}

		const { default: proxiedBundler } = proxyquire( '../src/bundler.js', {
			rollup: {
				rollup: rollupStub
			},

			'rollup-plugin-commonjs': commonJSStub,
			'@rollup/plugin-json': jsonStub,
			'rollup-plugin-babel': babelStub,
			'rollup-plugin-terser': {
				terser: terserStub
			},
			'@babel/preset-env': presetStub,
			'./generateBanner.js': generateBannerStub
		} );

		return proxiedBundler( bundlerConfig() ).then( () => {
			expect( rollupStub ).to.have.been.calledTwice;
			expect( commonJSStub ).to.have.been.calledTwice;
			expect( jsonStub ).to.have.been.calledTwice;
			expect( babelStub ).to.have.been.calledTwice;
			expect( terserStub ).to.have.been.calledTwice;

			checkCalls( 'commonjs', commonJSStub.getCalls() );
			checkCalls( 'json', jsonStub.getCalls() );
			checkCalls( 'babel', babelStub.getCalls() );
			checkCalls( 'terser', terserStub.getCalls() );

			checkPlugins( rollupStub.firstCall.args[ 0 ] );
			checkPlugins( rollupStub.secondCall.args[ 0 ] );
		} );
	} );

	// #105
	it( 'generates non-empty sourcemap', () => {
		return bundler( bundlerConfig() ).then( () => {
			const correctMappingsRegex = /;[a-z0-9]+,/i;

			const mapES5 = JSON.parse( readFileSync( 'tests/fixtures/testPackage/dist/es5.js.map' ) );
			const mapES2015 = JSON.parse( readFileSync( 'tests/fixtures/testPackage/dist/es2015.js.map' ) );

			expect( mapES5.mappings ).to.match( correctMappingsRegex );
			expect( mapES2015.mappings ).to.match( correctMappingsRegex );
		} );
	} );
} );

describe( 'bundler/jsonPackage', () => {
	before( () => {
		rimraf( 'tests/fixtures/jsonPackage/dist' );
	} );

	after( () => {
		rimraf( 'tests/fixtures/jsonPackage/dist' );
	} );

	// #155
	it( 'should load JSON file', () => {

		function testExecution( filename ) {
			const codeES5 = readFileSync( filename ).toString();
			const consoleSpy = spy( console, 'log' );

			// I'm so sorry!
			eval( codeES5 );

			expect( consoleSpy.calledWithExactly( 'Piotr Kowalski' ) ).to.be.true;
			expect( consoleSpy.callCount ).to.equal( 1 );
			consoleSpy.restore();
		}

		return bundler( bundlerConfig( 'jsonPackage' ) ).then( () => {

			testExecution( 'tests/fixtures/jsonPackage/dist/es5.js' );
			testExecution( 'tests/fixtures/jsonPackage/dist/es2015.js' );

		} );
	} );
} );

function checkFiles( files ) {
	files.forEach( ( file ) => {
		expect( existsSync( file ) ).to.equal( true );
	} );
}

function checkBanner( file ) {
	const fileContent = readFileSync( file, 'utf8' );
	const banner = fileContent.match( /^\/\*!(.+?)\*\/\n{1}/ );

	expect( banner ).to.not.be.null;
}

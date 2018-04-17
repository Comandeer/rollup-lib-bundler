import { existsSync } from 'fs';
import { readFileSync } from 'fs';
import { sync as rimraf } from 'rimraf';
import { use } from 'chai';
import { expect } from 'chai';
import { noCallThru } from 'proxyquire';
import { spy } from 'sinon';
import { stub } from 'sinon';
import sinonChai from 'sinon-chai';
import bundler from '../src/bundler';

const proxyquire = noCallThru();
use( sinonChai );

const metadata = {
	name: 'test-package',
	author: 'Comandeer',
	license: 'MIT',
	version: '9.0.1'
};
const bundlerConfig = Object.assign( {}, metadata, {
	src: 'tests/fixtures/testPackage/src/index.js',
	dist: {
		esm: 'tests/fixtures/testPackage/dist/es2015.js',
		cjs: 'tests/fixtures/testPackage/dist/es5.js'
	}
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

describe( 'bundler', () => {
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
		return bundler( bundlerConfig ).then( () => {
			checkFiles( [
				'tests/fixtures/testPackage/dist/es5.js',
				'tests/fixtures/testPackage/dist/es5.js.map',
				'tests/fixtures/testPackage/dist/es2015.js',
				'tests/fixtures/testPackage/dist/es2015.js.map'
			] );
		} );
	} );

	it( 'produces correct banner', () => {
		return bundler( bundlerConfig ).then( () => {
			checkBanner( 'tests/fixtures/testPackage/dist/es5.js' );
			checkBanner( 'tests/fixtures/testPackage/dist/es2015.js' );
		} );
	} );

	// #58
	it( 'does not emit warning about deprecated options', () => {
		const consoleSpy = spy( console, 'warn' );

		return bundler( bundlerConfig ).then( () => {
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
		const babelMinifyStub = stub().returns( {
			name: 'babel-minify'
		} );
		const preset = {
			name: '@comandeer/babel-preset-rollup'
		};
		const banner = 'This is banner';
		const generateBannerStub = stub().returns( banner );
		const rollupStub = stub().returns( {
			write() {}
		} );
		const config = {
			commonjs: undefined,

			babel: {
				babelrc: false,
				presets: [
					[ preset ]
				]
			},

			'babel-minify': {
				comments: false,
				banner,
				bannerNewLine: true
			}
		};

		function checkCalls( name, calls ) {
			calls.forEach( ( call ) => {
				expect( call.args[ 0 ] ).to.deep.equal( config[ name ] );
			} );
		}

		function checkPlugins( { plugins } ) {
			expect( plugins ).to.be.an( 'array' );
			expect( plugins ).to.have.lengthOf( 3 );

			expect( plugins[ 0 ].name ).to.equal( 'commonjs' );
			expect( plugins[ 1 ].name ).to.equal( 'babel' );
			expect( plugins[ 2 ].name ).to.equal( 'babel-minify' );
		}

		const { default: proxiedBundler } = proxyquire( '../src/bundler.js', {
			rollup: {
				rollup: rollupStub
			},

			'rollup-plugin-commonjs': commonJSStub,
			'rollup-plugin-babel': babelStub,
			'rollup-plugin-babel-minify': babelMinifyStub,
			'@comandeer/babel-preset-rollup': preset,
			'./generateBanner.js': generateBannerStub
		} );

		return proxiedBundler( bundlerConfig ).then( () => {
			expect( rollupStub ).to.have.been.calledTwice;
			expect( commonJSStub ).to.have.been.calledTwice;
			expect( babelStub ).to.have.been.calledTwice;
			expect( babelMinifyStub ).to.have.been.calledTwice;

			checkCalls( 'commonjs', commonJSStub.getCalls() );
			checkCalls( 'babel', babelStub.getCalls() );
			checkCalls( 'babel-minify', babelMinifyStub.getCalls() );

			checkPlugins( rollupStub.firstCall.args[ 0 ] );
			checkPlugins( rollupStub.secondCall.args[ 0 ] );
		} );
	} );
} );

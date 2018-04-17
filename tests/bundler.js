'use strict';

const fs = require( 'fs' );
const rimraf = require( 'rimraf' ).sync;
const chai = require( 'chai' );
const { callThru } = require( 'proxyquire' );
const { spy } = require( 'sinon' );
const { stub } = require( 'sinon' );
const sinonChai = require( 'sinon-chai' );
const expect = chai.expect;
const bundler = require( '../src/bundler' ).default;
const proxyquire = callThru();

chai.use( sinonChai );

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
		expect( fs.existsSync( file ) ).to.equal( true );
	} );
}

function checkBanner( file ) {
	const fileContent = fs.readFileSync( file, 'utf8' );
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

	// #67
	it( 'transpiles both versions of the bundle', () => {
		function checkBabelPlugin( { plugins } ) {
			return plugins[ 1 ] && plugins[ 1 ].name === 'babel';
		}

		const rollupStub = stub().returns( {
			write() {}
		} );
		const { default: proxiedBundler } = proxyquire( '../src/bundler.js', {
			rollup: {
				rollup: rollupStub
			}
		} );

		return proxiedBundler( bundlerConfig ).then( () => {
			expect( rollupStub ).to.have.been.calledTwice;
			expect( checkBabelPlugin( rollupStub.firstCall.args[ 0 ] ) ).to.be.true;
			expect( checkBabelPlugin( rollupStub.secondCall.args[ 0 ] ) ).to.be.true;
		} );
	} );
} );

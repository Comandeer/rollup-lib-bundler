'use strict';

const fs = require( 'fs' );
const rimraf = require( 'rimraf' ).sync;
const chai = require( 'chai' );
const expect = chai.expect;
const bundler = require( '../dist/rollup-lib-bundler' ).bundler;

function checkFiles( files ) {
	files.forEach( ( file ) => {
		expect( fs.existsSync( file ) ).to.equal( true );
	} );
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
		return bundler( {
			name: 'test-package',
			moduleName: 'testPackage',
			author: 'Comandeer',
			license: 'MIT',
			version: '9.0.1',
			src: 'tests/fixtures/testPackage/src/index.js',
			dist: {
				es2015: 'tests/fixtures/testPackage/dist/es2015.js',
				es5: 'tests/fixtures/testPackage/dist/es5.js'
			}
		} ).then( () => {
			checkFiles( [
				'tests/fixtures/testPackage/dist/es5.js',
				'tests/fixtures/testPackage/dist/es5.js.map',
				'tests/fixtures/testPackage/dist/es2015.js',
				'tests/fixtures/testPackage/dist/es2015.js.map'
			] );
		} );
	} );
} );

'use strict';

const fs = require( 'fs' );
const rimraf = require( 'rimraf' ).sync;
const chai = require( 'chai' );
const expect = chai.expect;
const rlb = require( '../src/index' ).default;
const oldCwd = process.cwd();

function checkFiles( files ) {
	files.forEach( ( file ) => {
		expect( fs.existsSync( file ) ).to.equal( true );
	} );
}

describe( 'rlb', () => {
	before( () => {
		process.chdir( 'tests/fixtures/testPackage' );
		rimraf( 'dist' );
	} );

	after( () => {
		rimraf( 'dist' );
		process.chdir( oldCwd );
	} );

	it( 'is a function', () => {
		expect( rlb ).to.be.a( 'function' );
	} );

	it( 'bundles files based on current working directory', () => {
		return rlb().then( () => {
			checkFiles( [
				'dist/es5.js',
				'dist/es5.js.map',
				'dist/es2015.js',
				'dist/es2015.js.map'
			] );
		} );
	} );
} );

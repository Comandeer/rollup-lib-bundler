'use strict';

const fs = require( 'fs' );
const rimraf = require( 'rimraf' ).sync;
const chai = require( 'chai' );
const expect = chai.expect;
const bundler = require( '../src/bundler' ).default;

const metadata = {
	name: 'test-package',
	author: 'Comandeer',
	license: 'MIT',
	version: '9.0.1',
};
const bundlerConfig = Object.assign( {}, metadata, {
	src: 'tests/fixtures/testPackage/src/index.js',
	dist: {
		es2015: 'tests/fixtures/testPackage/dist/es2015.js',
		es5: 'tests/fixtures/testPackage/dist/es5.js'
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
} );

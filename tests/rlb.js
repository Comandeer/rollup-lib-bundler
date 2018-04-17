import { existsSync } from 'fs';
import { sync as rimraf } from 'rimraf';
import { expect } from 'chai';
import rlb from '../src/index';

const oldCwd = process.cwd();

function checkFiles( files ) {
	files.forEach( ( file ) => {
		expect( existsSync( file ) ).to.equal( true );
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

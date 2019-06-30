import { existsSync } from 'fs';
import { resolve as resolvePath } from 'path';
import { execSync } from 'child_process';
import { sync as rimraf } from 'rimraf';
import { expect } from 'chai';

const oldCwd = process.cwd();
const cwd = resolvePath( __dirname, 'fixtures/testPackage' );

function checkFiles( files ) {
	files.forEach( ( file ) => {
		expect( existsSync( file ) ).to.equal( true );
	} );
}

describe( 'rlb', () => {
	before( () => {
		process.chdir( cwd );
		rimraf( 'dist' );
	} );

	after( () => {
		rimraf( 'dist' );
		process.chdir( oldCwd );
	} );

	it( 'bundles files based on current working directory', () => {
		const binPath = resolvePath( __dirname, '../bin/bundler' );

		execSync( `node ${ binPath }`, { cwd } );

		checkFiles( [
			'dist/es5.js',
			'dist/es5.js.map',
			'dist/es2015.js',
			'dist/es2015.js.map'
		] );
	} );
} );

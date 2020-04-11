import { resolve as resolvePath } from 'path';
import { sync as rimraf } from 'rimraf';
import { expect } from 'chai';
import createFixtureTest from './helpers/createFixtureTest.js';
import rlb from '../src/index.js';

const oldCwd = process.cwd();
const fixturePath = resolvePath( __dirname, 'fixtures/testPackage' );
const outputPath = resolvePath( fixturePath, 'dist' );

describe( 'rlb', () => {
	before( () => {
		process.chdir( fixturePath );
		rimraf( 'dist' );
	} );

	after( () => {
		rimraf( 'dist' );
		process.chdir( oldCwd );
	} );

	it( 'is a function', () => {
		expect( rlb ).to.be.a( 'function' );
	} );

	it( 'bundles files based on current working directory', createFixtureTest( {
		cwd: fixturePath,
		cmd: rlb,
		expected: [
			resolvePath( outputPath, 'es5.js' ),
			resolvePath( outputPath, 'es5.js.map' ),
			resolvePath( outputPath, 'es2015.js' ),
			resolvePath( outputPath, 'es2015.js.map' )
		]
	} ) );
} );

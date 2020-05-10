import { resolve as resolvePath } from 'path';
import { expect } from 'chai';
import createFixtureTest from './helpers/createFixtureTest.js';
import removeArtifacts from './helpers/removeArtifacts.js';
import rlb from '../src/index.js';
import * as rlbPackage from '../src/index.js';

const oldCwd = process.cwd();
const fixturesPath = resolvePath( __dirname, 'fixtures' );
const basicFixturePath = resolvePath( fixturesPath, 'testPackage' );
const jsonFixturePath = resolvePath( fixturesPath, 'jsonPackage' );

describe( 'package', () => {
	before( () => {
		removeArtifacts( fixturesPath );
	} );

	after( () => {
		removeArtifacts( fixturesPath );
		process.chdir( oldCwd );
	} );

	// #164
	it( 'has one, default export', () => {
		expect( rlbPackage ).to.have.all.keys( 'default' );
	} );

	describe( 'default export', () => {
		it( 'is a function', () => {
			expect( rlb ).to.be.a( 'function' );
		} );

		it( 'bundles files based on current working directory', createRlbTest( basicFixturePath ) );

		// #155
		it( 'bundles package that imports JSON content', createRlbTest( jsonFixturePath, {
			additionalCodeChecks( code ) {
				const regex = /name:\s?["']Piotr Kowalski["']/;

				expect( code ).to.match( regex );
			}
		} ) );
	} );
} );

function createRlbTest( fixturePath, { additionalCodeChecks } = {} ) {
	const outputPath = resolvePath( fixturePath, 'dist' );

	return createFixtureTest( {
		path: fixturePath,
		cwd: fixturePath,
		cmd: rlb,
		expected: [
			resolvePath( outputPath, 'es5.js' ),
			resolvePath( outputPath, 'es5.js.map' ),
			resolvePath( outputPath, 'es2015.js' ),
			resolvePath( outputPath, 'es2015.js.map' )
		],
		additionalCodeChecks
	} );
}

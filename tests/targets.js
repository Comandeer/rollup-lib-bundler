/* globals expect */

import { engines } from '../package.json';
import * as targets from '../src/targets.js';

describe( 'targets', () => {
	describe( 'node', () => {
		it( 'exports node version in semver format', () => {
			expect( targets.node ).to.be.a( 'string' );
			expect( targets.node ).to.match( /^\d+(\.\d+(\.\d+)?)?$/ );
		} );

		it( 'is the same as in package.json engines.node field', () => {
			const versionRegex = /\d+(\.\d+(\.\d+)?)?$/;
			const expected = engines.node.match( versionRegex )[ 0 ];

			expect( targets.node ).to.equal( expected );
		} );
	} );
} );

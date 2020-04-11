import { expect } from 'chai';
import * as targets from '../src/targets.js';

describe( 'targets', () => {
	it( 'exports node version in semver format', () => {
		expect( targets.node ).to.be.a( 'string' );
		expect( targets.node ).to.match( /^\d+\.\d+\.\d+$/ );
	} );
} );

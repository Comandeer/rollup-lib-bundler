import { expect } from 'chai';
import * as rlbPackage from '../src/index.js';

describe( 'package', () => {
	// #164
	it( 'has one, default import', () => {
		expect( rlbPackage ).to.have.all.keys( 'default' );
	} );
} );

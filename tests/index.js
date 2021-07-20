import rlb from '../src/index.js';
import * as rlbPackage from '../src/index.js';

describe( 'package', () => {
	// #164
	it( 'has one, default export', () => {
		expect( rlbPackage ).to.have.all.keys( 'default' );
	} );

	describe( 'default export', () => {
		it( 'is a function', () => {
			expect( rlb ).to.be.a( 'function' );
		} );
	} );
} );

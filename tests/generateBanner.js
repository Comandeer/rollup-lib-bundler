'use strict';

const chai = require( 'chai' );
const expect = chai.expect;
const generateBanner = require( '../src/generateBanner' ).default;

describe( 'generateBanner', () => {
	it( 'produces correct banner', () => {
		const metadata = {
			name: 'test-package',
			author: 'Comandeer',
			license: 'MIT',
			version: '9.0.1'
		};
		const expected = `/*! test-package v9.0.1 | (c) ${new Date().getFullYear()} Comandeer | MIT license (see LICENSE) */`;
		const banner = generateBanner( metadata );

		expect( banner ).to.equal( expected );
	} );
} );

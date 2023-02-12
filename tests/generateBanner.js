import test from 'ava';
import generateBanner from '../src/generateBanner.js';

test( 'generateBanner() produces correct banner', ( t ) => {
	const metadata = {
		name: 'test-package',
		author: 'Comandeer',
		license: 'MIT',
		version: '9.0.1'
	};
	const expected = `/*! test-package v9.0.1 | (c) ${ new Date().getFullYear() } Comandeer | MIT license (see LICENSE) */`;
	const banner = generateBanner( metadata );

	t.is( banner, expected );
} );

import test from 'ava';
import { generateBanner } from '../src/generateBanner.js';
import type { PackageMetadata } from '../src/packageParser.js';

test( 'generateBanner() produces correct banner', ( t ) => {
	const metadata: PackageMetadata = {
		project: '.',
		name: 'test-package',
		author: 'Comandeer',
		license: 'MIT',
		version: '9.0.1',
		dist: {},
		targets: {
			node: 'current'
		}
	};
	const expected = `/*! test-package v9.0.1 | (c) ${ new Date().getFullYear() } Comandeer | MIT license (see LICENSE) */`;
	const banner = generateBanner( metadata );

	t.is( banner, expected );
} );

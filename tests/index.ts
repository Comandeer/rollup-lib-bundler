import test from 'ava';
import { rlb } from '../src/index.js';
import * as rlbPackage from '../src/index.js';

// #164, #339
test( 'package has one, named export', ( t ) => {
	const actualExports = Object.keys( rlbPackage );
	const expectedExports = [
		'rlb'
	];

	t.deepEqual( actualExports, expectedExports );
} );

test( 'package\'s rlb export is a function', ( t ) => {
	t.is( typeof rlb, 'function' );
} );

import test from 'ava';
import rlb from '../src/index.js';
import * as rlbPackage from '../src/index.js';

// #164
test( 'package has one, default exports', ( t ) => {
	const actualExports = Object.keys( rlbPackage );
	const expectedExports = [
		'default'
	];

	t.deepEqual( actualExports, expectedExports );
} );

test( 'package default export is a function', ( t ) => {
	t.is( typeof rlb, 'function' );
} );

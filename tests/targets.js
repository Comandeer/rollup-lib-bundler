import  test from 'ava';
import { engines } from '../package.json';
import * as targets from '../src/targets.js';

const SEMVER_REGEX = /^\d+(\.\d+(\.\d+)?)?$/;
const VERSION_REGEX = /\d+(\.\d+(\.\d+)?)?$/;

test( 'targets exports node version in semver format', ( t ) => {
	t.is( typeof targets.node, 'string' );
	t.regex( targets.node, SEMVER_REGEX );
} );

test( 'targets node version is the same as in package.json engines.node field', ( t ) => {
	const expected = engines.node.match( VERSION_REGEX )[ 0 ];

	t.is( targets.node, expected );
} );

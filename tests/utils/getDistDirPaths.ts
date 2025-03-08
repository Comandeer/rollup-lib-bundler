import test from 'ava';
import getDistDirPaths from '../../src/utils/getDistDirPaths.js';
import type { PackageMetadata } from '../../src/packageParser.js';

test( '#getDistDirPaths() is a function', ( t ) => {
	t.is( typeof getDistDirPaths, 'function' );
} );

test( '#getDistDirPaths() returns an array of absolute paths to dist directories', ( t ) => {
	const packageMetadata: PackageMetadata = {
		name: 'test-package',
		version: '0.0.0',
		license: 'MIT',
		author: 'Comandeer',
		project: '/dummy-project',
		dist: {
			[ 'src/index.ts' ]: {
				esm: './dist/test-package.mjs',
				types: './hublabubla/test-package.d.ts',
				type: 'ts',
				isBin: false
			},

			[ 'src/submodule.js' ]: {
				esm: './grim/submodule.js',
				type: 'js',
				isBin: false
			},

			[ 'src/another-submodule.js' ]: {
				esm: './grim/another-submodule.js',
				type: 'js',
				isBin: false
			},

			[ 'src/__bin__/bin.mjs' ]: {
				esm: './bin.js',
				type: 'js',
				isBin: true
			}
		},
		targets: {
			node: 'current'
		}
	};
	const distDirPaths = getDistDirPaths( packageMetadata );

	t.deepEqual( distDirPaths, [
		'/dummy-project/dist',
		'/dummy-project/hublabubla',
		'/dummy-project/grim',
		'/dummy-project'
	] );
} );

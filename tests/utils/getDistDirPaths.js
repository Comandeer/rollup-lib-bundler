import test from 'ava';
import getDistDirPaths from '../../src/utils/getDistDirPaths.js';

test( '#getDistDirPaths() is a function', ( t ) => {
	t.is( typeof getDistDirPaths, 'function' );
} );

test( '#getDistDirPaths() returns an array of absolute paths to dist directories', ( t ) => {
	const packageMetadata = {
		project: '/dummy-project',
		dist: {
			[ 'src/index.js' ]: {
				esm: './dist/test-package.mjs',
				cjs: './hublabubla/test-package.cjs',
				types: './dist/test-package.d.ts',
				type: 'ts'
			},

			[ 'src/submodule.js' ]: {
				esm: './grim/submodule.js',
				cjs: './submodule.cjs',
				type: 'js'
			},

			[ 'src/another-submodule.js' ]: {
				esm: './grim/another-submodule.js',
				cjs: './another-submodule.cjs',
				type: 'js'
			}
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

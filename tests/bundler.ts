import { resolve as resolvePath } from 'pathe';
import test from 'ava';
import createPackageMetadata from './__helpers__/createPackageMetadata.js';
import testWithSinonSandbox from './__helpers__/macros/testWithSinonSandbox.js';
import removeArtifacts from './__helpers__/removeArtifacts.js';
import bundler from '../src/bundler.js';

const fixturesPath = resolvePath( import.meta.dirname!, '__fixtures__' );
const errorPackageFixturePath = resolvePath( fixturesPath, 'generic', 'errorPackage' );
const externalDepPackageFixturePath = resolvePath( fixturesPath, 'generic', 'externalDepPackage' );

test( 'bundler() is a function', ( t ) => {
	t.is( typeof bundler, 'function' );
} );

// #156
test( 'bundler() throws error when any error is encountered', async ( t ) => {
	const packageMetadata = createPackageMetadata( errorPackageFixturePath, {
		'src/index.js': {
			esm: './dist/index.mjs',
			type: 'js'
		}
	} );

	await t.throwsAsync( bundler( {
		packageMetadata
	} ) );
} );

// #193
test( 'bundler() handle warnings via provided onWarn() method', testWithSinonSandbox, async ( t, sandbox ) => {
	t.teardown( async () => {
		return removeArtifacts( externalDepPackageFixturePath );
	} );

	const packageMetadata = createPackageMetadata( externalDepPackageFixturePath, {
		'src/index.js': {
			esm: './dist/index.mjs',
			type: 'js'
		}
	} );
	const onWarnSpy = sandbox.spy();

	await bundler( {
		packageMetadata,
		onWarn: onWarnSpy
	} );

	t.true( onWarnSpy.called );
} );

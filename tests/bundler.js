import { resolve as resolvePath } from 'pathe';
import test from 'ava';
import createPackageInfo from './__helpers__/createPackageInfo.js';
import testWithSinonSandbox from './__helpers__/macros/testWithSinonSandbox.js';
import bundler from '../src/bundler.js';
import removeArtifacts from './__helpers__/removeArtifacts.js';
import getDirName from './__helpers__/getDirName.js';

const __dirname = getDirName( import.meta.url );
const fixturesPath = resolvePath( __dirname, '__fixtures__' );
const errorPackageFixturePath = resolvePath( fixturesPath, 'errorPackage' );
const externalDepPackageFixturePath = resolvePath( fixturesPath, 'externalDepPackage' );

test( 'bundler() is a function', ( t ) => {
	t.is( typeof bundler, 'function' );
} );

// #156
test( 'bundler() throws error when any error is encountered', async ( t ) => {
	const packageInfo = createPackageInfo( errorPackageFixturePath, {
		'src/index.js': {
			esm: './dist/index.mjs',
			type: 'js'
		}
	} );

	await t.throwsAsync( bundler( {
		packageInfo
	} ) );
} );

// #193
test( 'bundler() handle warnings via provided onWarn() method', testWithSinonSandbox, async ( t, sandbox ) => {
	t.teardown( async () => {
		return removeArtifacts( externalDepPackageFixturePath );
	} );

	const packageInfo = createPackageInfo( externalDepPackageFixturePath, {
		'src/index.js': {
			esm: './dist/index.mjs',
			type: 'js'
		}
	} );
	const onWarnSpy = sandbox.spy();

	await bundler( {
		packageInfo,
		onWarn: onWarnSpy
	} );

	t.true( onWarnSpy.called );
} );

import { access } from 'node:fs/promises';
import { mkdir } from 'node:fs/promises';
import { writeFile } from 'node:fs/promises';
import { resolve as resolvePath } from 'node:path';
import test from 'ava';
import testCLI from './__helpers__/macros/testCLI.js';

const defaultExpectedFiles = [
	'test-package.cjs',
	'test-package.cjs.map',
	'test-package.mjs',
	'test-package.mjs.map'
];
const cmdResultChecks = {
	isSuccesful: ( t, { stdout, stderr } ) => {
		t.true( stdout.includes( 'Bundling complete!' ) );
		t.is( stderr, '' );
	},

	isFailed: ( t, { stdout, stderr } ) => {
		t.true( stdout.includes( 'Bundling failed!' ) );
		t.true( stderr.includes( '🚨Error🚨' ) );
	},

	noError: ( t, { stderr } ) => {
		t.false( stderr.includes( 'Bundling failed!' ) );
		t.false( stderr.includes( '🚨Error🚨' ) );
	},

	skippedCJSBuild: ( t, { stderr } ) => {
		t.true( stderr.includes( 'Skipping CJS build for' ) );
	}
};

test( 'CLI bundles files based on current working directory', testCLI, {
	fixture: 'testPackage',
	expectedFiles: defaultExpectedFiles
} );

// #61
test( 'CLI bundles package based on exports fields', testCLI, {
	fixture: 'exportsPackage',
	expectedFiles: defaultExpectedFiles
} );

// #155
test( 'CLI bundles package that imports JSON content', testCLI, {
	fixture: 'jsonPackage',
	expectedFiles: defaultExpectedFiles,
	additionalCodeChecks: [
		( t, path, code ) => {
			const regex = /name:\s?["']Piotr Kowalski["']/;

			t.regex( code, regex );
		}
	]
} );

// #185
test( 'CLI bundles package based on subpath exports fields', testCLI, {
	fixture: 'subPathExportsPackage',
	expectedFiles: [
		'also-not-related-name.js',
		'also-not-related-name.js.map',
		'not-related-name.cjs',
		'not-related-name.cjs.map',
		'test-package.cjs',
		'test-package.cjs.map',
		'test-package.mjs',
		'test-package.mjs.map'
	],
	additionalCodeChecks: [
		( t, path, code ) => {
			const isChunk = path.includes( 'related-name' );
			const expectedString = `console.log("${ isChunk ? 'chunk' : 'index' }");`;

			t.true( code.includes( expectedString ) );
		}
	]
} );

// #215
test( 'CLI bundles ESM-only package based on exports fields', testCLI, {
	fixture: 'noCJSPackage',
	expectedFiles: [
		'package.mjs',
		'package.mjs.map'
	],
	cmdResultChecks: [
		cmdResultChecks.noError,
		cmdResultChecks.skippedCJSBuild
	]
} );

// #215
test( 'CLI bundles ESM-only package based on subpath exports fields', testCLI, {
	fixture: 'noCJSSubPathExportsPackage',
	expectedFiles: [
		'also-not-related-name.js',
		'also-not-related-name.js.map',
		'es6.mjs',
		'es6.mjs.map'
	],
	additionalCodeChecks: [
		( t, path, code ) => {
			const isChunk = path.includes( 'related-name' );
			const expectedString = `console.log("${ isChunk ? 'chunk' : 'index' }");`;

			t.true( code.includes( expectedString ) );
		}
	],
	cmdResultChecks: [
		cmdResultChecks.noError,
		cmdResultChecks.skippedCJSBuild
	]
} );

// #220, #237
test( 'CLI bundles TypeScript package', testCLI, {
	fixture: 'tsPackage',
	expected: [
		'index.cjs',
		'index.cjs.map',
		'index.d.ts',
		'index.mjs',
		'index.mjs.map',
		'chunk.cjs',
		'chunk.cjs.map',
		'chunk.mjs',
		'chunk.mjs.map'
	],
	cmdResultChecks: [
		cmdResultChecks.noError
	]
} );

// #220
test( 'CLI bundles TypeScript package without the tsconfig.json file', testCLI, {
	fixture: 'noTSConfigTSPackage',
	expected: [
		'index.cjs',
		'index.cjs.map',
		'index.d.ts',
		'index.mjs',
		'index.mjs.map'
	],
	cmdResultChecks: [
		cmdResultChecks.isSuccesful
	]
} );

// #242
test( 'CLI bundles TypeScript package with complex directory structure', testCLI, {
	fixture: 'tsComplexPackage',
	expectedFiles: [
		'index.cjs',
		'index.cjs.map',
		'index.d.ts',
		'index.mjs',
		'index.mjs.map',
		'submodule.d.ts',
		'subdir/submodule.cjs',
		'subdir/submodule.cjs.map',
		'subdir/submodule.mjs',
		'subdir/submodule.mjs.map'
	],
	cmdResultChecks: [
		cmdResultChecks.noError
	]
} );

// #222
test( 'CLI preserves dynamic external imports', testCLI, {
	fixture: 'dynamicExternalImport',
	expectedFiles: defaultExpectedFiles,
	additionalCodeChecks: [
		( t, path, code ) => {
			const dynamicImportRegex = /await import\(\s*['"]node:fs['"]\s*\)/;

			t.regex( code, dynamicImportRegex );
		}
	]
} );

// #255
test( 'CLI transpiles bundled JS files down to code understandable by Node v16.0.0', testCLI, {
	fixture: 'babelTranspilationTSPackage',
	expectedFiles: [
		'chunk.cjs',
		'chunk.cjs.map',
		'chunk.mjs',
		'chunk.mjs.map',
		'index.cjs',
		'index.cjs.map',
		'index.d.ts',
		'index.mjs',
		'index.mjs.map'
	],
	cmdResultChecks: [
		cmdResultChecks.noError
	],
	customCheckStrategies: {
		// For some reason class static initialization block
		// failes sourcemap check.
		'.map': () => {}
	},
	additionalCodeChecks: [
		( t, path, code ) => {
			t.false( code.includes( 'static{' ) );
		}
	]
} );

// #193
test( 'CLI displays output for valid package', testCLI, {
	fixture: 'testPackage',
	cmdResultChecks: [
		cmdResultChecks.isSuccesful
	]
} );

// #156
test( 'CLI displays error for invalid package', testCLI, {
	fixture: 'errorPackage',
	cmdResultChecks: [
		cmdResultChecks.isFailed
	]
} );

// #204
test( 'cleans dist directory before bundling', testCLI, {
	fixture: 'testPackage',
	before: async ( t, packagePath ) => {
		return createDummyDist( t, packagePath );
	},
	after: async ( t, packagePath ) => {
		const dummyFilePath = resolvePath( packagePath, 'dist', 'dummy.js' );

		return t.throwsAsync( access( dummyFilePath ) );
	},
	cmdResultChecks: [
		cmdResultChecks.isSuccesful
	]
} );

async function createDummyDist( t, packagePath ) {
	const distPath = resolvePath( packagePath, 'dist' );
	const dummyFilePath = resolvePath( distPath, 'dummy.js' );

	// If creating the dir fails, it's most probably already there.
	try {
		await mkdir( distPath );
	} catch {
		// Just silent the error;
	}

	await writeFile( dummyFilePath, 'hublabubla', 'utf-8' );

	return dummyFilePath;
}

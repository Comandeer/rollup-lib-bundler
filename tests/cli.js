import { access, constants, mkdir, writeFile } from 'node:fs/promises';
import { resolve as resolvePath } from 'pathe';
import test from 'ava';
import testCLI from './__helpers__/macros/testCLI.js';

const defaultExpectedFiles = [
	'./dist/test-package.mjs',
	'./dist/test-package.mjs.map'
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
	}
};
const customCheckStrategies = {
	skipSourceMaps: new Map( [
		[ /\.map$/, () => {} ]
	] )
};
const additionalCodeChecks = {
	checkResolvingOfOtherBundles( expectedImports ) {
		return ( t, path, code ) => {
			const expectedImportsForCurrentFile = [ ...expectedImports ].find( ( [ file ] ) => {
				return path.endsWith( file );
			} );

			if ( typeof expectedImportsForCurrentFile === 'undefined' ) {
				return;
			}

			const [ file, imports ] = expectedImportsForCurrentFile;

			imports.forEach( ( expectedImport ) => {
				const expectedImportEscapedForRegex = expectedImport.replace( /[.]/g, '\\.' );
				const importRegex = file.endsWith( '.cjs' ) ?
					new RegExp( `require\\(\\s*["']${ expectedImportEscapedForRegex }["']\\s*\\)` ) :
					new RegExp( `(import|export).+?from\\s*["']${ expectedImportEscapedForRegex }["']` );

				t.regex( code, importRegex, `${ expectedImport } in ${ file }` );
				t.false( code.includes( 'rlb:' ), 'All placeholder imports were removed' );
			} );
		};
	},

	checkShebang( filesToCheck ) {
		return ( t, path, code ) => {
			const isFileToCheck = filesToCheck.some( ( file ) => {
				return path.endsWith( file );
			} );

			if ( !isFileToCheck ) {
				return;
			}

			t.true( code.startsWith( '#!/usr/bin/env node' ) );
		};
	},

	checkBinPermissions( filesToCheck ) {
		return async ( t, path ) => {
			const isFileToCheck = filesToCheck.some( ( file ) => {
				return path.endsWith( file );
			} );

			if ( !isFileToCheck ) {
				return;
			}

			await t.notThrowsAsync( () => {
				return access( path, constants.X_OK );
			} );
		};
	}
};

test.serial( 'CLI bundles files based on current working directory', testCLI, {
	fixture: 'testPackage',
	expectedFiles: defaultExpectedFiles
} );

// #61
test.serial( 'CLI bundles package based on exports fields', testCLI, {
	fixture: 'exportsPackage',
	expectedFiles: defaultExpectedFiles
} );

// #155
test.serial( 'CLI bundles package that imports JSON content', testCLI, {
	fixture: 'jsonPackage',
	expectedFiles: defaultExpectedFiles,
	// For some reason source map check fails.
	customCheckStrategies: customCheckStrategies.skipSourceMaps,
	additionalCodeChecks: [
		( t, path, code ) => {
			const regex = /name:\s?["']Piotr Kowalski["']/;

			t.regex( code, regex );
		}
	]
} );

// #271
test.serial( 'CLI bundles ESM package that imports JSON content with import assertion', testCLI, {
	fixture: 'jsonESMPackage',
	expectedFiles: [
		'./dist/test-package.mjs',
		'./dist/test-package.mjs.map'
	],
	// For some reason source map check fails.
	customCheckStrategies: customCheckStrategies.skipSourceMaps,
	cmdResultChecks: [
		cmdResultChecks.noError
	],
	additionalCodeChecks: [
		( t, path, code ) => {
			const regex = /["']6\.5\.3["']/;

			t.regex( code, regex );
		}
	]
} );

// #185
test.serial( 'CLI bundles package based on subpath exports fields', testCLI, {
	fixture: 'subPathExportsPackage',
	expectedFiles: [
		'./dist/also-not-related-name.js',
		'./dist/also-not-related-name.js.map',
		'./dist/test-package.mjs',
		'./dist/test-package.mjs.map'
	],
	additionalCodeChecks: [
		( t, path, code ) => {
			const isChunk = path.includes( 'related-name' );
			const expectedString = `console.log("${ isChunk ? 'chunk' : 'index' }");`;

			t.true( code.includes( expectedString ) );
		}
	]
} );

// #220, #237
test.serial( 'CLI bundles TypeScript package', testCLI, {
	fixture: 'tsPackage',
	expectedFiles: [
		'./dist/chunk.mjs',
		'./dist/chunk.mjs.map',
		'./dist/index.d.ts',
		'./dist/index.mjs',
		'./dist/index.mjs.map'
	],
	cmdResultChecks: [
		cmdResultChecks.noError
	],
	customCheckStrategies: customCheckStrategies.skipSourceMaps
} );

// #220
test.serial( 'CLI bundles TypeScript package without the tsconfig.json file', testCLI, {
	fixture: 'noTSConfigTSPackage',
	expectedFiles: [
		'./dist/index.d.ts',
		'./dist/index.mjs',
		'./dist/index.mjs.map'
	],
	customCheckStrategies: customCheckStrategies.skipSourceMaps,
	cmdResultChecks: [
		cmdResultChecks.isSuccesful
	]
} );

// #264
test.serial( 'CLI correctly bundles TypeScript package with .mts and .cts files', testCLI, {
	fixture: 'mtsAndCTSPackage',
	expectedFiles: [
		'./dist/chunk.d.ts',
		'./dist/chunk.mjs',
		'./dist/chunk.mjs.map',
		'./dist/index.d.ts',
		'./dist/index.mjs',
		'./dist/index.mjs.map'
	],
	cmdResultChecks: [
		cmdResultChecks.noError
	],
	customCheckStrategies: customCheckStrategies.skipSourceMaps
} );

// #242
test.serial( 'CLI bundles TypeScript package with complex directory structure', testCLI, {
	fixture: 'tsComplexPackage',
	expectedFiles: [
		'./dist/index.d.ts',
		'./dist/index.mjs',
		'./dist/index.mjs.map',
		'./dist/submodule.d.ts',
		'./dist/subdir/submodule.mjs',
		'./dist/subdir/submodule.mjs.map'
	],
	// For some reason source map check fails.
	customCheckStrategies: customCheckStrategies.skipSourceMaps,
	cmdResultChecks: [
		cmdResultChecks.noError
	]
} );

// #222
test.serial( 'CLI preserves dynamic external imports', testCLI, {
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
test.serial( 'CLI transpiles bundled JS files down to code understandable by Node v16.0.0', testCLI, {
	fixture: 'babelTranspilationTSPackage',
	expectedFiles: [
		'./dist/chunk.mjs',
		'./dist/chunk.mjs.map',
		'./dist/index.d.ts',
		'./dist/index.mjs',
		'./dist/index.mjs.map'
	],
	cmdResultChecks: [
		cmdResultChecks.noError
	],
	// For some reason class static initialization block
	// failes sourcemap check.
	customCheckStrategies: customCheckStrategies.skipSourceMaps,
	additionalCodeChecks: [
		( t, path, code ) => {
			t.false( code.includes( 'static{' ) );
		}
	]
} );

// #230
test.serial( 'CLI treats import of other bundles as external dependencies (TS package)', testCLI, {
	fixture: 'importingOtherBundlesTSPackage',
	expectedFiles: [
		'./dist/chunk.d.ts',
		'./dist/chunk.mjs',
		'./dist/chunk.mjs.map',
		'./dist/index.d.ts',
		'./dist/index.mjs',
		'./dist/index.mjs.map',
		'./dist/subdir/submodule.d.ts',
		'./dist/subdir/submodule.mjs',
		'./dist/subdir/submodule.mjs.map'
	],
	cmdResultChecks: [
		cmdResultChecks.noError
	],
	// For some reason source map check fails.
	customCheckStrategies: customCheckStrategies.skipSourceMaps,
	additionalCodeChecks: [
		additionalCodeChecks.checkResolvingOfOtherBundles( new Map( [
			[
				'chunk.mjs',
				[
					'./subdir/submodule.mjs'
				]
			],

			[
				'index.mjs',
				[
					'./chunk.mjs',
					'./subdir/submodule.mjs'
				]
			],

			[
				'index.d.ts',
				[
					'./chunk.js',
					'./subdir/submodule.js'
				]
			]
		] ) )
	]
} );

// #230
test.serial( 'CLI treats import of other bundles as external dependencies (JS package)', testCLI, {
	fixture: 'importingOtherBundlesJSPackage',
	expectedFiles: [
		'./dist/chunk.mjs',
		'./dist/chunk.mjs.map',
		'./dist/index.mjs',
		'./dist/index.mjs.map',
		'./dist/subdir/submodule.mjs',
		'./dist/subdir/submodule.mjs.map'
	],
	cmdResultChecks: [
		cmdResultChecks.noError
	],
	// For some reason source map check fails.
	customCheckStrategies: customCheckStrategies.skipSourceMaps,
	additionalCodeChecks: [
		additionalCodeChecks.checkResolvingOfOtherBundles( new Map( [
			[
				'index.mjs',
				[
					'./chunk.mjs',
					'./subdir/submodule.mjs'
				]
			],

			[
				'subdir/submodule.mjs',
				[
					'../chunk.mjs'
				]
			]
		] ) )
	]
} );

// #116
test.serial( 'CLI correctly bundles binaries (simple bin format, JS package)', testCLI, {
	fixture: 'simpleBinJSPackage',
	expectedFiles: [
		'./dist/index.mjs',
		'./dist/index.mjs.map',
		'./dist/__bin__/test-package.mjs',
		'./dist/__bin__/test-package.mjs.map'
	],
	cmdResultChecks: [
		cmdResultChecks.noError
	],
	// For some reason source map check fails.
	customCheckStrategies: customCheckStrategies.skipSourceMaps,
	additionalCodeChecks: [
		additionalCodeChecks.checkResolvingOfOtherBundles( new Map( [
			[
				'__bin__/test-package.mjs',
				[
					'../index.mjs'
				]
			]
		] ) ),

		additionalCodeChecks.checkShebang( [
			'__bin__/test-package.mjs'
		] ),

		additionalCodeChecks.checkBinPermissions( [
			'__bin__/test-package.mjs'
		] )
	]
} );

// #116
test.serial( 'CLI correctly bundles binaries (simple bin format, TS package)', testCLI, {
	fixture: 'simpleBinTSPackage',
	expectedFiles: [
		'./dist/index.d.ts',
		'./dist/index.mjs',
		'./dist/index.mjs.map',
		'./dist/__bin__/test-package.mjs',
		'./dist/__bin__/test-package.mjs.map'
	],
	cmdResultChecks: [
		cmdResultChecks.noError
	],
	// For some reason source map check fails.
	customCheckStrategies: customCheckStrategies.skipSourceMaps,
	additionalCodeChecks: [
		additionalCodeChecks.checkResolvingOfOtherBundles( new Map( [
			[
				'__bin__/test-package.mjs',
				[
					'../index.mjs'
				]
			]
		] ) ),

		additionalCodeChecks.checkShebang( [
			'__bin__/test-package.mjs'
		] ),

		additionalCodeChecks.checkBinPermissions( [
			'__bin__/test-package.mjs'
		] )
	]
} );

// #116
test.serial( 'CLI correctly bundles binaries (complex bin format, JS package)', testCLI, {
	fixture: 'complexBinJSPackage',
	expectedFiles: [
		'./dist/index.mjs',
		'./dist/index.mjs.map',
		'./dist/__bin__/aside.mjs',
		'./dist/__bin__/aside.mjs.map',
		'./dist/__bin__/test-package.mjs',
		'./dist/__bin__/test-package.mjs.map'
	],
	cmdResultChecks: [
		cmdResultChecks.noError
	],
	// For some reason source map check fails.
	customCheckStrategies: customCheckStrategies.skipSourceMaps,
	additionalCodeChecks: [
		additionalCodeChecks.checkResolvingOfOtherBundles( new Map( [
			[
				'__bin__/test-package.mjs',
				[
					'../index.mjs'
				]
			]
		] ) ),

		additionalCodeChecks.checkShebang( [
			'__bin__/aside.mjs',
			'__bin__/test-package.mjs'
		] ),

		additionalCodeChecks.checkBinPermissions( [
			'__bin__/aside.mjs',
			'__bin__/test-package.mjs'
		] ),

		( t, code, path ) => {
			if ( !path.endsWith( 'aside.mjs' ) ) {
				return;
			}

			const consoleLogRegex = /console\.log\(\s*['"]aside['"]\s*\);/;

			t.regex( code, consoleLogRegex, 'aside bin correctly imported aside source file' );
		}
	]
} );

// #116
test.serial( 'CLI correctly bundles binaries (complex bin format, TS package)', testCLI, {
	fixture: 'complexBinTSPackage',
	expectedFiles: [
		'./dist/index.d.ts',
		'./dist/index.mjs',
		'./dist/index.mjs.map',
		'./dist/__bin__/aside.mjs',
		'./dist/__bin__/aside.mjs.map',
		'./dist/__bin__/test-package.mjs',
		'./dist/__bin__/test-package.mjs.map'
	],
	cmdResultChecks: [
		cmdResultChecks.noError
	],
	// For some reason source map check fails.
	customCheckStrategies: customCheckStrategies.skipSourceMaps,
	additionalCodeChecks: [
		additionalCodeChecks.checkResolvingOfOtherBundles( new Map( [
			[
				'__bin__/test-package.mjs',
				[
					'../index.mjs'
				]
			]
		] ) ),

		additionalCodeChecks.checkShebang( [
			'__bin__/aside.mjs',
			'__bin__/test-package.mjs'
		] ),

		additionalCodeChecks.checkBinPermissions( [
			'__bin__/aside.mjs',
			'__bin__/test-package.mjs'
		] ),

		( t, code, path ) => {
			if ( !path.endsWith( 'aside.mjs' ) ) {
				return;
			}

			const consoleLogRegex = /console\.log\(\s*['"]aside['"]\s*\);/;

			t.regex( code, consoleLogRegex, 'aside bin correctly imported aside source file' );
		}
	]
} );

// #265
test.serial( 'CLI correctly bundles JS package with non-standard dist directory', testCLI, {
	fixture: 'nonStandardDistJSPackage',
	expectedFiles: [
		'./hublabubla/test-package.mjs',
		'./hublabubla/test-package.mjs.map'
	]
} );

// #265
test.serial( 'CLI correctly bundles TS package with non-standard dist directory', testCLI, {
	fixture: 'nonStandardDistTSPackage',
	expectedFiles: [
		'./hublabubla/chunk.mjs',
		'./hublabubla/chunk.mjs.map',
		'./hublabubla/index.d.ts',
		'./hublabubla/index.mjs',
		'./hublabubla/index.mjs.map'
	],
	cmdResultChecks: [
		cmdResultChecks.noError
	],
	customCheckStrategies: customCheckStrategies.skipSourceMaps
} );

// #265
test.serial( 'CLI correctly bundles binaries (simple bin format, JS package, non-standard dist directory)', testCLI, {
	fixture: 'nonStandardDistSimpleBinJSPackage',
	expectedFiles: [
		'./hublabubla/index.mjs',
		'./hublabubla/index.mjs.map',
		'./hublabubla/__bin__/test-package.mjs',
		'./hublabubla/__bin__/test-package.mjs.map'
	],
	cmdResultChecks: [
		cmdResultChecks.noError
	],
	// For some reason source map check fails.
	customCheckStrategies: customCheckStrategies.skipSourceMaps,
	additionalCodeChecks: [
		additionalCodeChecks.checkResolvingOfOtherBundles( new Map( [
			[
				'__bin__/test-package.mjs',
				[
					'../index.mjs'
				]
			]
		] ) ),

		additionalCodeChecks.checkShebang( [
			'__bin__/test-package.mjs'
		] ),

		additionalCodeChecks.checkBinPermissions( [
			'__bin__/test-package.mjs'
		] )
	]
} );

// #265
test.serial( 'CLI correctly bundles binaries (simple bin format, TS package, non-standard dist directory)', testCLI, {
	fixture: 'nonStandardDistSimpleBinTSPackage',
	expectedFiles: [
		'./hublabubla/index.d.ts',
		'./hublabubla/index.mjs',
		'./hublabubla/index.mjs.map',
		'./hublabubla/__bin__/test-package.mjs',
		'./hublabubla/__bin__/test-package.mjs.map'
	],
	cmdResultChecks: [
		cmdResultChecks.noError
	],
	// For some reason source map check fails.
	customCheckStrategies: customCheckStrategies.skipSourceMaps,
	additionalCodeChecks: [
		additionalCodeChecks.checkResolvingOfOtherBundles( new Map( [
			[
				'__bin__/test-package.mjs',
				[
					'../index.mjs'
				]
			]
		] ) ),

		additionalCodeChecks.checkShebang( [
			'__bin__/test-package.mjs'
		] ),

		additionalCodeChecks.checkBinPermissions( [
			'__bin__/test-package.mjs'
		] )
	]
} );

// #265
test.serial( 'CLI correctly bundles binaries (complex bin format, JS package, non-standard dist directory)', testCLI, {
	fixture: 'nonStandardDistComplexBinJSPackage',
	expectedFiles: [
		'./hublabubla/index.mjs',
		'./hublabubla/index.mjs.map',
		'./hublabubla/__bin__/aside.mjs',
		'./hublabubla/__bin__/aside.mjs.map',
		'./hublabubla/__bin__/test-package.mjs',
		'./hublabubla/__bin__/test-package.mjs.map'
	],
	cmdResultChecks: [
		cmdResultChecks.noError
	],
	// For some reason source map check fails.
	customCheckStrategies: customCheckStrategies.skipSourceMaps,
	additionalCodeChecks: [
		additionalCodeChecks.checkResolvingOfOtherBundles( new Map( [
			[
				'__bin__/test-package.mjs',
				[
					'../index.mjs'
				]
			]
		] ) ),

		additionalCodeChecks.checkShebang( [
			'__bin__/aside.mjs',
			'__bin__/test-package.mjs'
		] ),

		additionalCodeChecks.checkBinPermissions( [
			'__bin__/aside.mjs',
			'__bin__/test-package.mjs'
		] ),

		( t, code, path ) => {
			if ( !path.endsWith( 'aside.mjs' ) ) {
				return;
			}

			const consoleLogRegex = /console\.log\(\s*['"]aside['"]\s*\);/;

			t.regex( code, consoleLogRegex, 'aside bin correctly imported aside source file' );
		}
	]
} );

// #265
test.serial( 'CLI correctly bundles binaries (complex bin format, TS package, non-standard dist directory)', testCLI, {
	fixture: 'nonStandardDistComplexBinTSPackage',
	expectedFiles: [
		'./hublabubla/index.d.ts',
		'./hublabubla/index.mjs',
		'./hublabubla/index.mjs.map',
		'./hublabubla/__bin__/aside.mjs',
		'./hublabubla/__bin__/aside.mjs.map',
		'./hublabubla/__bin__/test-package.mjs',
		'./hublabubla/__bin__/test-package.mjs.map'
	],
	cmdResultChecks: [
		cmdResultChecks.noError
	],
	// For some reason source map check fails.
	customCheckStrategies: customCheckStrategies.skipSourceMaps,
	additionalCodeChecks: [
		additionalCodeChecks.checkResolvingOfOtherBundles( new Map( [
			[
				'__bin__/test-package.mjs',
				[
					'../index.mjs'
				]
			]
		] ) ),

		additionalCodeChecks.checkShebang( [
			'__bin__/aside.mjs',
			'__bin__/test-package.mjs'
		] ),

		additionalCodeChecks.checkBinPermissions( [
			'__bin__/aside.mjs',
			'__bin__/test-package.mjs'
		] ),

		( t, code, path ) => {
			if ( !path.endsWith( 'aside.mjs' ) ) {
				return;
			}

			const consoleLogRegex = /console\.log\(\s*['"]aside['"]\s*\);/;

			t.regex( code, consoleLogRegex, 'aside bin correctly imported aside source file' );
		}
	]
} );

// #300
test.serial( 'CLI correctly bundles type definitions for bundles without type definition file', testCLI, {
	fixture: 'types/bundleWithoutDTSFilePackage',
	expectedFiles: [
		'./dist/fn.mjs',
		'./dist/fn.mjs.map',
		'./dist/index.d.ts',
		'./dist/index.mjs',
		'./dist/index.mjs.map'
	],
	cmdResultChecks: [
		cmdResultChecks.isSuccesful
	],
	customCheckStrategies: customCheckStrategies.skipSourceMaps,
	additionalCodeChecks: [
		( t, path, code ) => {
			if ( !path.endsWith( 'index.d.ts' ) ) {
				return;
			}

			t.regex( code, /declare function fn\(\): number;/ );
		}
	]
} );

// #193
test.serial( 'CLI displays output for valid package', testCLI, {
	fixture: 'testPackage',
	cmdResultChecks: [
		cmdResultChecks.isSuccesful
	]
} );

// #156
test.serial( 'CLI displays error for invalid package', testCLI, {
	fixture: 'errorPackage',
	cmdResultChecks: [
		cmdResultChecks.isFailed
	]
} );

// #204
test.serial( 'cleans dist directory before bundling', testCLI, {
	fixture: 'testPackage',
	before: async ( t, packagePath ) => {
		return createDummyDists( packagePath );
	},
	after: async ( t, packagePath ) => {
		return assertDummyFileIsDeleted( t, packagePath );
	},
	cmdResultChecks: [
		cmdResultChecks.isSuccesful
	]
} );

// #275
test.serial( 'CLI skips bundling the CJS output', testCLI, {
	fixture: 'cjsExportPackage',
	expectedFiles: defaultExpectedFiles
} );

// #265
test.serial( 'cleans all non-standard dist directories before bundling', testCLI, {
	fixture: 'nonStandardMultipleDistJSPackage',
	before: async ( t, packagePath ) => {
		return createDummyDists( packagePath, [
			'hublabubla',
			'grim'
		] );
	},
	after: async ( t, packagePath ) => {
		return assertDummyFileIsDeleted( t, packagePath, [
			'hublabubla',
			'grim'
		] );
	},
	cmdResultChecks: [
		cmdResultChecks.isSuccesful
	]
} );

// #265
test.serial( 'skip cleaning the root directory if it is the dist one', testCLI, {
	fixture: 'nonStandardRootDistJSPackage',
	before: async ( t, packagePath ) => {
		return createDummyDists( packagePath, [
			'.'
		] );
	},
	after: async ( t, packagePath ) => {
		const dummyFilePath = resolvePath( packagePath, 'dummy.js' );

		return t.notThrowsAsync( access( dummyFilePath ) );
	},
	cmdResultChecks: [
		cmdResultChecks.isSuccesful
	]
} );

async function createDummyDists( packagePath, distDirs = [ 'dist' ] ) {
	const distDirsPromises = distDirs.map( async ( distDir ) => {
		const distPath = resolvePath( packagePath, distDir );
		const dummyFilePath = resolvePath( distPath, 'dummy.js' );

		// If creating the dir fails, it's most probably already there.
		try {
			await mkdir( distPath, {
				recursive: true
			} );
		} catch {
			// Just silent the error;
		}

		await writeFile( dummyFilePath, 'hublabubla', 'utf-8' );
	} );

	return Promise.all( distDirsPromises );
}

async function assertDummyFileIsDeleted( t, packagePath, distDirs = [ 'dist' ] ) {
	const dummyFilesPromises = distDirs.map( async ( distDir ) => {
		const distPath = resolvePath( packagePath, distDir );
		const dummyFilePath = resolvePath( distPath, 'dummy.js' );

		return t.throwsAsync( access( dummyFilePath ) );
	} );

	return Promise.all( dummyFilesPromises );
}

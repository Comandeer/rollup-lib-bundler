import { access, constants, mkdir, writeFile } from 'node:fs/promises';
import { resolve as resolvePath } from 'pathe';
import test, { ExecutionContext } from 'ava';
import testCLI from './__helpers__/macros/testCLI.js';
import { ExecaReturnValue } from 'execa';
import { AdditionalCodeCheckCallback, CheckStrategiesMap } from './__helpers__/checkDistFiles.js';

type LinkedBundleMap = Map<string, Array<string>>;

const defaultExpectedFiles = [
	'./dist/test-package.mjs',
	'./dist/test-package.mjs.map'
];
const cmdResultChecks = {
	isSuccesful: ( t: ExecutionContext, { stdout, stderr }: ExecaReturnValue ): void => {
		t.true( stdout.includes( 'Bundling complete!' ) );
		t.is( stderr, '' );
	},

	isFailed: ( t: ExecutionContext, { stdout, stderr }: ExecaReturnValue ): void => {
		t.true( stdout.includes( 'Bundling failed!' ) );
		t.true( stderr.includes( '🚨Error🚨' ) );
	},

	noError: ( t: ExecutionContext, { stderr }: ExecaReturnValue ): void => {
		t.false( stderr.includes( 'Bundling failed!' ) );
		t.false( stderr.includes( '🚨Error🚨' ) );
	}
};
const customCheckStrategies: Record<string, CheckStrategiesMap> = {
	skipSourceMaps: new Map( [
		[ /\.map$/, (): void => {} ]
	] )
};
const additionalCodeChecks = {
	checkResolvingOfLinkedBundles( expectedImports: LinkedBundleMap ): AdditionalCodeCheckCallback {
		return ( t: ExecutionContext, path: string, code: string ): void => {
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

	checkShebang( filesToCheck: Array<string> ): AdditionalCodeCheckCallback {
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

	checkBinPermissions( filesToCheck: Array<string> ): AdditionalCodeCheckCallback {
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
	fixture: 'generic/testPackage',
	expectedFiles: defaultExpectedFiles
} );

// #61
test.serial( 'CLI bundles package based on exports fields', testCLI, {
	fixture: 'generic/exportsPackage',
	expectedFiles: defaultExpectedFiles
} );

// #155
test.serial( 'CLI bundles package that imports JSON content', testCLI, {
	fixture: 'json/jsonPackage',
	expectedFiles: defaultExpectedFiles,
	// For some reason source map check fails.
	customCheckStrategies: customCheckStrategies.skipSourceMaps,
	additionalCodeChecks: [
		( t: ExecutionContext, path: string, code: string ): void => {
			const regex = /name:\s?["']Piotr Kowalski["']/;

			t.regex( code, regex );
		}
	]
} );

// #271
test.serial( 'CLI bundles ESM package that imports JSON content with import assertion', testCLI, {
	fixture: 'json/jsonESMPackage',
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
		( t: ExecutionContext, path: string, code: string ): void => {
			const regex = /["']6\.5\.3["']/;

			t.regex( code, regex );
		}
	]
} );

// #185
test.serial( 'CLI bundles package based on subpath exports fields', testCLI, {
	fixture: 'generic/subPathExportsPackage',
	expectedFiles: [
		'./dist/also-not-related-name.js',
		'./dist/also-not-related-name.js.map',
		'./dist/test-package.mjs',
		'./dist/test-package.mjs.map'
	],
	additionalCodeChecks: [
		( t: ExecutionContext, path: string, code: string ): void => {
			const isChunk = path.includes( 'related-name' );
			const expectedString = `console.log("${ isChunk ? 'chunk' : 'index' }");`;

			t.true( code.includes( expectedString ) );
		}
	]
} );

// #220, #237
test.serial( 'CLI bundles TypeScript package', testCLI, {
	fixture: 'typescript/tsPackage',
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
	fixture: 'typescript/noTSConfigTSPackage',
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
	fixture: 'typescript/mtsAndCTSPackage',
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
	fixture: 'typescript/tsComplexPackage',
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
	fixture: 'generic/dynamicExternalImport',
	expectedFiles: defaultExpectedFiles,
	additionalCodeChecks: [
		( t: ExecutionContext, path: string, code: string ): void => {
			const dynamicImportRegex = /await import\(\s*['"]node:fs['"]\s*\)/;

			t.regex( code, dynamicImportRegex );
		}
	]
} );

// #255, #314
test.serial( 'CLI transpiles bundled JS files down to code understandable by Node v20.0.0', testCLI, {
	fixture: 'typescript/babelTranspilationTSPackage',
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
		( t: ExecutionContext, path: string, code: string ): void => {
			if ( !path.endsWith( '.mjs' ) ) {
				return;
			}

			t.true( code.includes( 'static{' ) );
		}
	]
} );

// #230
test.serial( 'CLI treats import of other bundles as external dependencies (TS package)', testCLI, {
	fixture: 'bundles/importingOtherBundlesTSPackage',
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
		additionalCodeChecks.checkResolvingOfLinkedBundles( new Map( [
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
					'./chunk.mjs',
					'./subdir/submodule.mjs'
				]
			]
		] ) )
	]
} );

// #230
test.serial( 'CLI treats import of other bundles as external dependencies (JS package)', testCLI, {
	fixture: 'bundles/importingOtherBundlesJSPackage',
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
		additionalCodeChecks.checkResolvingOfLinkedBundles( new Map( [
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
	fixture: 'bin/simpleBinJSPackage',
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
		additionalCodeChecks.checkResolvingOfLinkedBundles( new Map( [
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
	fixture: 'bin/simpleBinTSPackage',
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
		additionalCodeChecks.checkResolvingOfLinkedBundles( new Map( [
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
	fixture: 'bin/complexBinJSPackage',
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
		additionalCodeChecks.checkResolvingOfLinkedBundles( new Map( [
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

		( t: ExecutionContext, code: string, path: string ): void => {
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
	fixture: 'bin/complexBinTSPackage',
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
		additionalCodeChecks.checkResolvingOfLinkedBundles( new Map( [
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

		( t: ExecutionContext, code: string, path: string ): void => {
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
	fixture: 'distDirs/nonStandardDistJSPackage',
	expectedFiles: [
		'./hublabubla/test-package.mjs',
		'./hublabubla/test-package.mjs.map'
	]
} );

// #265
test.serial( 'CLI correctly bundles TS package with non-standard dist directory', testCLI, {
	fixture: 'distDirs/nonStandardDistTSPackage',
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
	fixture: 'distDirs/nonStandardDistSimpleBinJSPackage',
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
		additionalCodeChecks.checkResolvingOfLinkedBundles( new Map( [
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
	fixture: 'distDirs/nonStandardDistSimpleBinTSPackage',
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
		additionalCodeChecks.checkResolvingOfLinkedBundles( new Map( [
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
	fixture: 'distDirs/nonStandardDistComplexBinJSPackage',
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
		additionalCodeChecks.checkResolvingOfLinkedBundles( new Map( [
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

		( t: ExecutionContext, code: string, path: string ): void => {
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
	fixture: 'distDirs/nonStandardDistComplexBinTSPackage',
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
		additionalCodeChecks.checkResolvingOfLinkedBundles( new Map( [
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

		( t: ExecutionContext, code: string, path: string ): void => {
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
		( t: ExecutionContext, path: string, code: string ): void => {
			if ( !path.endsWith( 'index.d.ts' ) ) {
				return;
			}

			t.regex( code, /declare function fn\(\): number;/ );
		}
	]
} );

// #300
test.serial( 'CLI correctly bundles type definitions for bundles in non-standard dist directories', testCLI, {
	fixture: 'types/bundlesInNonStandardDistDirsPackage',
	expectedFiles: [
		'./hublabubla/index.d.ts',
		'./hublabubla/index.mjs',
		'./hublabubla/index.mjs.map',
		'./some-dist/fn.d.ts',
		'./some-dist/fn.mjs',
		'./some-dist/fn.mjs.map'
	],
	cmdResultChecks: [
		cmdResultChecks.isSuccesful
	],
	customCheckStrategies: customCheckStrategies.skipSourceMaps,
	additionalCodeChecks: [
		additionalCodeChecks.checkResolvingOfLinkedBundles( new Map( [
			[
				'index.mjs',
				[
					'../some-dist/fn.mjs'
				]
			],

			[
				'index.d.ts',
				[
					'../some-dist/fn.mjs'
				]
			]
		] ) )
	]
} );

// #193
test.serial( 'CLI displays output for valid package', testCLI, {
	fixture: 'generic/testPackage',
	cmdResultChecks: [
		cmdResultChecks.isSuccesful
	]
} );

// #156
test.serial( 'CLI displays error for invalid package', testCLI, {
	fixture: 'generic/errorPackage',
	cmdResultChecks: [
		cmdResultChecks.isFailed
	]
} );

// #204
test.serial( 'cleans dist directory before bundling', testCLI, {
	fixture: 'generic/testPackage',
	before: async ( t: ExecutionContext, packagePath: string ) => {
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
	fixture: 'generic/cjsExportPackage',
	expectedFiles: defaultExpectedFiles
} );

// #265
test.serial( 'cleans all non-standard dist directories before bundling', testCLI, {
	fixture: 'distDirs/nonStandardMultipleDistJSPackage',
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
	fixture: 'distDirs/nonStandardRootDistJSPackage',
	before: async ( t, packagePath ) => {
		return createDummyDists( packagePath, [
			'.'
		] );
	},
	after: async ( t, packagePath ) => {
		const dummyFilePath = resolvePath( packagePath, 'dummy.js' );

		await t.notThrowsAsync( access( dummyFilePath ) );
	},
	cmdResultChecks: [
		cmdResultChecks.isSuccesful
	]
} );

async function createDummyDists( packagePath, distDirs = [ 'dist' ] ): Promise<void> {
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

	await Promise.all( distDirsPromises );
}

async function assertDummyFileIsDeleted(
	t: ExecutionContext,
	packagePath: string,
	distDirs = [ 'dist' ]
): Promise<void> {
	const dummyFilesPromises = distDirs.map( async ( distDir ) => {
		const distPath = resolvePath( packagePath, distDir );
		const dummyFilePath = resolvePath( distPath, 'dummy.js' );

		return t.throwsAsync( access( dummyFilePath ) );
	} );

	await Promise.all( dummyFilesPromises );
}

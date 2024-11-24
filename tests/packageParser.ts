import mockFS from 'mock-fs';
import { resolve as resolvePath } from 'pathe';
import test from 'ava';
import packageParser, { DistMetadata, PackageMetadata, PackageMetadataTargets, SubPathMetadata } from '../src/packageParser.js';

const packageJSONFixtures = {
	invalid: '',
	empty: {},

	onlyName: {
		name: 'test-package'
	},

	onlyNameAndVersion: {
		name: 'test-package',
		version: '9.0.1'
	},

	noESMEntrypoint: {
		name: 'test',
		version: '0.0.0',
		exports: {}
	},

	noAuthor: {
		name: 'test',
		version: '0.0.0',
		exports: {
			import: 'test'
		}
	},

	noLicense: {
		name: 'test',
		version: '0.0.0',
		exports: {
			import: 'test'
		},
		author: 'test'
	},

	validExports: {
		name: 'test-package',
		version: '9.0.1',
		author: 'Comandeer',
		license: 'MIT',
		exports: {
			import: './dist/test-package.mjs'
		}
	},

	validSubPathExports: {
		name: 'test-package',
		version: '1.0.0',
		exports: {
			'.': {
				import: './dist/es6.mjs'
			},
			'./chunk': {
				import: './dist/also-not-related-name.js'
			}
		},
		author: 'Comandeer',
		license: 'ISC'
	},

	nestedSubPathExports: {
		name: 'test-package',
		version: '1.0.0',
		exports: {
			'.': {
				import: './dist/index.mjs'
			},
			'./test/chunk': {
				import: './dist/nested/chunk.mjs'
			}
		},
		author: 'Comandeer',
		license: 'ISC'
	},

	withCJSExports: {
		name: 'test-package',
		version: '9.0.1',
		author: 'Comandeer',
		license: 'MIT',
		exports: {
			import: './dist/test-package.mjs',
			require: './dist/tests-package.cjs'
		}
	},

	withCJSSubPathExports: {
		name: 'test-package',
		version: '1.0.0',
		exports: {
			'.': {
				import: './dist/es6.mjs',
				require: './dist/es6.cjs'
			},
			'./chunk': {
				import: './dist/also-not-related-name.js',
				require: './dist/also-not-related-name.cjs'
			}
		},
		author: 'Comandeer',
		license: 'ISC'
	},

	tsProject: {
		name: 'test-package',
		version: '9.0.1',
		author: 'Comandeer',
		license: 'MIT',
		exports: {
			types: './dist/test-package.d.ts',
			import: './dist/test-package.mjs'
		}
	},

	noTypes: {
		name: 'test-package',
		version: '9.0.1',
		author: 'Comandeer',
		license: 'MIT',
		exports: {
			import: './dist/test-package.mjs'
		}
	},

	mixedProject: {
		name: 'test-package',
		version: '1.0.0',
		exports: {
			'.': {
				import: './dist/test-package.mjs',
				types: './dist/test-package.d.ts'
			},
			'./chunk': {
				import: './dist/chunk.mjs'
			}
		},
		author: 'Comandeer',
		license: 'ISC'
	},

	exportsDotImportOverExportsImport: {
		name: 'test-package',
		version: '9.0.1',
		author: 'Comandeer',
		license: 'MIT',
		exports: {
			'.': {
				import: './dist/subpath.mjs'
			},
			import: './dist/test-package.mjs'
		}
	},

	authorAsObject: {
		name: 'test-package',
		version: '9.0.1',
		author: {
			name: 'Tester'
		},
		license: 'MIT',
		exports: {
			import: './dist/test-package.mjs'
		}
	},

	// #116
	simpleBin: {
		name: 'test-package',
		version: '9.0.1',
		author: 'Comandeer',
		license: 'MIT',
		exports: {
			import: './dist/test-package.mjs'
		},
		bin: './dist/__bin__/test-package.mjs'
	},

	// #116
	complexBin: {
		name: 'test-package',
		version: '9.0.1',
		author: 'Comandeer',
		license: 'MIT',
		exports: {
			import: './dist/test-package.mjs'
		},
		bin: {
			whatever: './dist/__bin__/whatever.mjs'
		}
	},

	// #265
	nonStandardDist: {
		name: 'test-package',
		version: '9.0.1',
		author: 'Comandeer',
		license: 'MIT',
		exports: {
			import: './hublabubla/test-package.mjs'
		}
	},

	// #265
	nonStandardDistTS: {
		name: 'test-package',
		version: '9.0.1',
		author: 'Comandeer',
		license: 'MIT',
		exports: {
			types: './hublabubla/test-package.d.ts',
			import: './hublabubla/test-package.mjs'
		}
	},

	// #265
	nonStandardDistSimpleBin: {
		name: 'test-package',
		version: '9.0.1',
		author: 'Comandeer',
		license: 'MIT',
		exports: {
			import: './hublabubla/test-package.mjs'
		},
		bin: './hublabubla/__bin__/test-package.mjs'
	},

	// #265
	nonStandardDistComplexBin: {
		name: 'test-package',
		version: '9.0.1',
		author: 'Comandeer',
		license: 'MIT',
		exports: {
			import: './hublabubla/test-package.mjs'
		},
		bin: {
			whatever: './hublabubla/__bin__/whatever.mjs'
		}
	},

	// #275
	stringExports: {
		name: 'test-package',
		version: '9.0.1',
		author: 'Comandeer',
		license: 'MIT',
		exports: './dist/test-package.mjs'
	},

	// #275
	stringSubPathExports: {
		name: 'test-package',
		version: '9.0.1',
		author: 'Comandeer',
		license: 'MIT',
		exports: {
			'.': './dist/test-package.mjs',
			'./chunk': './dist/subpath.js'
		}
	},

	// #234
	engines: {
		name: 'test-package',
		version: '2.3.4',
		author: 'Comandeer',
		license: 'MIT',
		engines: {
			node: '>=0.10.3 <15'
		},
		exports: './dist/test-package.mjs'
	},

	// #234
	enginesInvalid: {
		name: 'test-package',
		version: '2.3.4',
		author: 'Comandeer',
		license: 'MIT',
		engines: {
			node: 'hublabubla'
		},
		exports: './dist/test-package.mjs'
	},

	// #234
	enginesImpossible: {
		name: 'test-package',
		version: '2.3.4',
		author: 'Comandeer',
		license: 'MIT',
		engines: {
			node: '>0.10.13 <0.10.14'
		},
		exports: './dist/test-package.mjs'
	}
};
const srcFixtures = {
	js: {
		src: {
			'index.js': ''
		}
	},
	mjs: {
		src: {
			'index.mjs': ''
		}
	},
	mixedJS: {
		src: {
			'index.js': '',
			'index.mjs': ''
		}
	},
	ts: {
		src: {
			'index.ts': ''
		},
		'tsconfig.json': ''
	},
	mts: {
		src: {
			'index.mts': ''
		},
		'tsconfig.json': ''
	},
	tsConfig: {
		src: {
			'index.ts': ''
		},
		'tsconfig.json': '',
		'tsconfig.rlb.json': ''
	},
	noTSConfig: {
		src: {
			'index.ts': ''
		}
	},
	subPath: {
		src: {
			'index.js': '',
			'chunk.mjs': ''
		}
	},
	tsSubPath: {
		src: {
			'index.ts': '',
			'chunk.ts': ''
		},
		'tsconfig.json': ''
	},
	nestedSubPath: {
		src: {
			'index.js': '',
			'test': {
				'chunk.mjs': ''
			}
		}
	},
	mixedProject: {
		src: {
			'index.ts': '',
			'chunk.mjs': ''
		},
		'tsconfig.json': ''
	},

	// #116
	simpleBinJS: {
		src: {
			'index.js': '',
			'__bin__': {
				'test-package.js': ''
			}
		}
	},

	// #116
	simpleBinTS: {
		src: {
			'index.ts': '',
			'__bin__': {
				'test-package.ts': ''
			}
		},
		'tsconfig.json': ''
	},

	// #116
	complexBinJS: {
		src: {
			'index.js': '',
			'__bin__': {
				'whatever.js': ''
			}
		}
	},

	// #116
	complexBinTS: {
		src: {
			'index.ts': '',
			'__bin__': {
				'whatever.ts': ''
			}
		},
		'tsconfig.json': ''
	}
};
const INVALID_ARGUMENT_TYPE_ERROR = 'Provide a path to a package directory.';
const MISSING_PACKAGE_JSON_ERROR = 'The package.json does not exist in the provided location.';
const INVALID_PACKAGE_JSON_ERROR = 'The package.json file is not parsable as a correct JSON.';
const INVALID_ESM_METADATA_ERROR = 'Package metadata must contain at least one of "exports[ \'.\' ].import" and "exports.import" properties ' +
	'or the "exports" property must contain the path.';

test.before( () => {
	mockFS( {
		// We need to load node_modules to make sure that we can resolve dependencies.
		'node_modules': mockFS.load( resolvePath( import.meta.dirname!, '../node_modules' ) ),
		...createMockedPackage( 'invalid', 'js', {
			stringify: false
		} ),
		...createMockedPackage( 'empty', 'js' ),
		...createMockedPackage( 'onlyName', 'js' ),
		...createMockedPackage( 'onlyNameAndVersion', 'js' ),
		...createMockedPackage( 'noESMEntrypoint', 'js' ),
		...createMockedPackage( 'noAuthor', 'js' ),
		...createMockedPackage( 'noLicense', 'js' ),
		...createMockedPackage( 'validExports', 'js' ),
		...createMockedPackage( 'validExports', 'mjs' ),
		...createMockedPackage( 'validExports', 'mixedJS' ),
		...createMockedPackage( 'validSubPathExports', 'subPath' ),
		...createMockedPackage( 'nestedSubPathExports', 'nestedSubPath' ),
		...createMockedPackage( 'withCJSExports', 'js' ),
		...createMockedPackage( 'withCJSSubPathExports', 'subPath' ),
		...createMockedPackage( 'tsProject', 'ts' ),
		...createMockedPackage( 'tsProject', 'mts' ),
		...createMockedPackage( 'tsProject', 'tsConfig' ),
		...createMockedPackage( 'tsProject', 'noTSConfig' ),
		...createMockedPackage( 'exportsDotImportOverExportsImport', 'js' ),
		...createMockedPackage( 'authorAsObject', 'js' ),
		...createMockedPackage( 'mixedProject', 'mixedProject' ),
		...createMockedPackage( 'noTypes', 'ts' ),
		...createMockedPackage( 'simpleBin', 'simpleBinJS' ),
		...createMockedPackage( 'simpleBin', 'simpleBinTS' ),
		...createMockedPackage( 'complexBin', 'complexBinJS' ),
		...createMockedPackage( 'complexBin', 'complexBinTS' ),
		...createMockedPackage( 'nonStandardDist', 'js' ),
		...createMockedPackage( 'nonStandardDistTS', 'ts' ),
		...createMockedPackage( 'nonStandardDistSimpleBin', 'simpleBinJS' ),
		...createMockedPackage( 'nonStandardDistSimpleBin', 'simpleBinTS' ),
		...createMockedPackage( 'nonStandardDistComplexBin', 'complexBinJS' ),
		...createMockedPackage( 'nonStandardDistComplexBin', 'complexBinTS' ),
		...createMockedPackage( 'stringExports', 'js' ),
		...createMockedPackage( 'stringExports', 'ts' ),
		...createMockedPackage( 'stringSubPathExports', 'subPath' ),
		...createMockedPackage( 'stringSubPathExports', 'tsSubPath' ),
		...createMockedPackage( 'engines', 'js' ),
		...createMockedPackage( 'enginesInvalid', 'js' ),
		...createMockedPackage( 'enginesImpossible', 'js' )
	} );
} );

test.after( mockFS.restore );

test( 'packageParser() is a function', ( t ) => {
	t.is( typeof packageParser, 'function' );
} );

test( 'packageParser() expects argument to be a path to a package directory', async ( t ) => {
	// @ts-expect-error
	await t.throwsAsync( packageParser(), {
		instanceOf: TypeError,
		message: INVALID_ARGUMENT_TYPE_ERROR
	} );

	// @ts-expect-error
	await t.throwsAsync( packageParser( 1 ), {
		instanceOf: TypeError,
		message: INVALID_ARGUMENT_TYPE_ERROR
	} );
} );

test( 'packageParser() resolves package.json from the given directory', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'validExports', 'js' );

	t.truthy( await packageParser( mockedPackagePath ) );
} );

test( 'packageParser() throws when package.json does not exist in the given directory', async ( t ) => {
	await t.throwsAsync( packageParser( '/non-existent' ), {
		instanceOf: ReferenceError,
		message: MISSING_PACKAGE_JSON_ERROR
	} );
} );

test( 'throws when package.json is not a valid JSON', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'invalid', 'js' );

	await t.throwsAsync( () => {
		return packageParser( mockedPackagePath );
	}, {
		instanceOf: SyntaxError,
		message: INVALID_PACKAGE_JSON_ERROR
	} );
} );

test( 'packageParser() linter requires the name property', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'empty', 'js' );

	await t.throwsAsync( () => {
		return packageParser( mockedPackagePath );
	}, {
		instanceOf: ReferenceError,
		message: 'Package metadata must contain "name" property.'
	} );
} );

test( 'packageParser() linter requires the version property', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'onlyName', 'js' );

	await t.throwsAsync( () => {
		return packageParser( mockedPackagePath );
	}, {
		instanceOf: ReferenceError,
		message: 'Package metadata must contain "version" property.'
	} );
} );

test( 'packageParser() linter requires the ESM output property', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'noESMEntrypoint', 'js' );

	await t.throwsAsync( () => {
		return packageParser( mockedPackagePath );
	}, {
		instanceOf: ReferenceError,
		message: INVALID_ESM_METADATA_ERROR
	} );
} );

test( 'packageParser() linter requires the author property', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'noAuthor', 'js' );

	await t.throwsAsync( () => {
		return packageParser( mockedPackagePath );
	}, {
		instanceOf: ReferenceError,
		message: 'Package metadata must contain "author" property.'
	} );
} );

test( 'packageParser() linter requires the license property', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'noLicense', 'js' );

	await t.throwsAsync( () => {
		return packageParser( mockedPackagePath );
	}, {
		instanceOf: ReferenceError,
		message: 'Package metadata must contain "license" property.'
	} );
} );

// #61
test( 'packageParser() returns simplified metadata', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'validExports', 'js' );
	const actualMetadata = await packageParser( mockedPackagePath );
	const expectedMetadata: PackageMetadata = {
		project: mockedPackagePath,
		name: 'test-package',
		author: 'Comandeer',
		license: 'MIT',
		version: '9.0.1',
		dist: {
			[ 'src/index.js' ]: {
				esm: './dist/test-package.mjs',
				type: 'js',
				isBin: false
			}
		},
		targets: {
			node: 'current'
		}
	};

	t.deepEqual( actualMetadata, expectedMetadata );
} );

// #185
test( 'packageParser() returns simplified metadata for package with subpath "exports" field', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'validSubPathExports', 'subPath' );
	const actualMetadata = await packageParser( mockedPackagePath );
	const expectedMetadata: PackageMetadata = {
		project: mockedPackagePath,
		name: 'test-package',
		author: 'Comandeer',
		license: 'ISC',
		version: '1.0.0',
		dist: {
			[ 'src/index.js' ]: {
				esm: './dist/es6.mjs',
				type: 'js',
				isBin: false
			},
			[ 'src/chunk.mjs' ]: {
				esm: './dist/also-not-related-name.js',
				type: 'js',
				isBin: false
			}
		},
		targets: {
			node: 'current'
		}
	};

	t.deepEqual( actualMetadata, expectedMetadata );
} );

// #215
test( 'packageParser() returns simplified metadata for package with CJS "exports" field', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'withCJSExports', 'js' );
	const actualMetadata = await packageParser( mockedPackagePath );
	const expectedMetadata: PackageMetadata = {
		project: mockedPackagePath,
		name: 'test-package',
		author: 'Comandeer',
		license: 'MIT',
		version: '9.0.1',
		dist: {
			[ 'src/index.js' ]: {
				esm: './dist/test-package.mjs',
				type: 'js',
				isBin: false
			}
		},
		targets: {
			node: 'current'
		}
	};

	t.deepEqual( actualMetadata, expectedMetadata );
} );

// #215
test( 'packageParser() returns simplified metadata for package with CJS subpath "exports" field', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'withCJSSubPathExports', 'subPath' );
	const actualMetadata = await packageParser( mockedPackagePath );
	const expectedMetadata: PackageMetadata = {
		project: mockedPackagePath,
		name: 'test-package',
		author: 'Comandeer',
		license: 'ISC',
		version: '1.0.0',
		dist: {
			[ 'src/index.js' ]: {
				esm: './dist/es6.mjs',
				type: 'js',
				isBin: false
			},
			[ 'src/chunk.mjs' ]: {
				esm: './dist/also-not-related-name.js',
				type: 'js',
				isBin: false
			}
		},
		targets: {
			node: 'current'
		}
	};

	t.deepEqual( actualMetadata, expectedMetadata );
} );

// #185
test( 'packageParser() prefers exports[ \'.\' ].import over exports.import', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'exportsDotImportOverExportsImport', 'js' );
	const expectedDistPath = packageJSONFixtures.exportsDotImportOverExportsImport.exports[ '.' ].import;
	const indexDistMetadata = await parseMetadataAndGetDistInfo( mockedPackagePath );
	const actualDistPath = indexDistMetadata.esm;

	t.is( actualDistPath, expectedDistPath );
} );

test( 'packageParser() parses author object into string', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'authorAsObject', 'js' );
	const expectedAuthor = packageJSONFixtures.authorAsObject.author.name;
	const parsedMetadata = await packageParser( mockedPackagePath );
	const actualAuthor = parsedMetadata.author;

	t.is( actualAuthor, expectedAuthor );
} );

// #220
test( 'packageParser() correctly detects JS type with single .js entry point', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'validExports', 'js' );
	const { dist: actualDist } = await packageParser( mockedPackagePath );
	const expectedDist: DistMetadata = {
		[ 'src/index.js' ]: {
			esm: './dist/test-package.mjs',
			type: 'js',
			isBin: false
		}
	};

	t.deepEqual( actualDist, expectedDist );
} );

// #220
test( 'packageParser() correctly detects JS type with single .mjs entry point', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'validExports', 'mjs' );
	const { dist: actualDist } = await packageParser( mockedPackagePath );
	const expectedDist: DistMetadata = {
		[ 'src/index.mjs' ]: {
			esm: './dist/test-package.mjs',
			type: 'js',
			isBin: false
		}
	};

	t.deepEqual( actualDist, expectedDist );
} );

// #220
test( 'packageParser() correctly detects JS type with .mjs and .js entry point', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'validExports', 'mixedJS' );
	const { dist: actualDist } = await packageParser( mockedPackagePath );
	const expectedDist: DistMetadata = {
		[ 'src/index.mjs' ]: {
			esm: './dist/test-package.mjs',
			type: 'js',
			isBin: false
		}
	};

	t.deepEqual( actualDist, expectedDist );
} );

// #220
test( 'packageParser() correctly detects JS type with single .js entry point and single .mjs subexport', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'validSubPathExports', 'subPath' );
	const { dist: actualDist } = await packageParser( mockedPackagePath );
	const expectedDist: DistMetadata = {
		[ 'src/index.js' ]: {
			esm: './dist/es6.mjs',
			type: 'js',
			isBin: false
		},

		[ 'src/chunk.mjs' ]: {
			esm: './dist/also-not-related-name.js',
			type: 'js',
			isBin: false
		}
	};

	t.deepEqual( actualDist, expectedDist );
} );

// #220
test( 'packageParser() correctly detects JS type with single .js entry point and single .mjs nested subexport', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'nestedSubPathExports', 'nestedSubPath' );
	const { dist: actualDist } = await packageParser( mockedPackagePath );
	const expectedDist: DistMetadata = {
		[ 'src/index.js' ]: {
			esm: './dist/index.mjs',
			type: 'js',
			isBin: false
		},

		[ 'src/test/chunk.mjs' ]: {
			esm: './dist/nested/chunk.mjs',
			type: 'js',
			isBin: false
		}
	};

	t.deepEqual( actualDist, expectedDist );
} );

// #220
test( 'packageParser() correctly detects TS type with single .ts entry point', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'tsProject', 'ts' );
	const { dist: actualDist } = await packageParser( mockedPackagePath );
	const expectedDist: DistMetadata = {
		[ 'src/index.ts' ]: {
			esm: './dist/test-package.mjs',
			tsConfig: 'tsconfig.json',
			types: './dist/test-package.d.ts',
			type: 'ts',
			isBin: false
		}
	};

	t.deepEqual( actualDist, expectedDist );
} );

// #220
test( 'packageParser() correctly detects TS type with single .mts entry point', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'tsProject', 'mts' );
	const { dist: actualDist } = await packageParser( mockedPackagePath );
	const expectedDist: DistMetadata = {
		[ 'src/index.mts' ]: {
			esm: './dist/test-package.mjs',
			tsConfig: 'tsconfig.json',
			types: './dist/test-package.d.ts',
			type: 'ts',
			isBin: false
		}
	};

	t.deepEqual( actualDist, expectedDist );
} );

// #220
test( 'packageParser() correctly detects mixed JS/TS projects', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'mixedProject', 'mixedProject' );
	const { dist: actualDist } = await packageParser( mockedPackagePath );
	const expectedDist: DistMetadata = {
		[ 'src/index.ts' ]: {
			esm: './dist/test-package.mjs',
			types: './dist/test-package.d.ts',
			tsConfig: 'tsconfig.json',
			type: 'ts',
			isBin: false
		},

		[ 'src/chunk.mjs' ]: {
			esm: './dist/chunk.mjs',
			type: 'js',
			isBin: false
		}
	};

	t.deepEqual( actualDist, expectedDist );
} );

test( 'packageParser() prefers ts.config.rlb.json file over tsconfig.json one in TS projects', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'tsProject', 'tsConfig' );
	const { dist: actualDist } = await packageParser( mockedPackagePath );
	const expectedDist: DistMetadata = {
		[ 'src/index.ts' ]: {
			esm: './dist/test-package.mjs',
			tsConfig: 'tsconfig.rlb.json',
			types: './dist/test-package.d.ts',
			type: 'ts',
			isBin: false
		}
	};

	t.deepEqual( actualDist, expectedDist );
} );

test( 'packageParser() skips tsConfig metadata if there is no tsconfig?(.rlb).json file in TS projects', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'tsProject', 'noTSConfig' );
	const { dist: actualDist } = await packageParser( mockedPackagePath );
	const expectedDist: DistMetadata = {
		[ 'src/index.ts' ]: {
			esm: './dist/test-package.mjs',
			types: './dist/test-package.d.ts',
			type: 'ts',
			isBin: false
		}
	};

	t.deepEqual( actualDist, expectedDist );
} );

test( 'packageParser() skips types metadata if there is no exports.types field in TS subpaths', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'noTypes', 'ts' );
	const { dist: actualDist } = await packageParser( mockedPackagePath );
	const expectedDist =  {
		[ 'src/index.ts' ]: {
			esm: './dist/test-package.mjs',
			tsConfig: 'tsconfig.json',
			type: 'ts',
			isBin: false
		}
	} ;

	t.deepEqual( actualDist, expectedDist );
} );

// #116
test( 'packageParser() correctly detects bin source file with the .js extension (simple bin format)', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'simpleBin', 'simpleBinJS' );
	const { dist: actualDist } = await packageParser( mockedPackagePath );
	const expectedDist: DistMetadata = {
		[ 'src/index.js' ]: {
			esm: './dist/test-package.mjs',
			type: 'js',
			isBin: false
		},

		[ 'src/__bin__/test-package.js' ]: {
			esm: './dist/__bin__/test-package.mjs',
			type: 'js',
			isBin: true
		}
	};

	t.deepEqual( actualDist, expectedDist );
} );

// #116
test( 'packageParser() correctly detects bin source file with the .ts extension (simple bin format)', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'simpleBin', 'simpleBinTS' );
	const { dist: actualDist } = await packageParser( mockedPackagePath );
	const expectedDist: DistMetadata = {
		[ 'src/index.ts' ]: {
			esm: './dist/test-package.mjs',
			type: 'ts',
			tsConfig: 'tsconfig.json',
			isBin: false
		},

		[ 'src/__bin__/test-package.ts' ]: {
			esm: './dist/__bin__/test-package.mjs',
			type: 'ts',
			tsConfig: 'tsconfig.json',
			isBin: true
		}
	};

	t.deepEqual( actualDist, expectedDist );
} );

// #116
test( 'packageParser() correctly detects bin source file with the .js extension (complex bin format)', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'complexBin', 'complexBinJS' );
	const { dist: actualDist } = await packageParser( mockedPackagePath );
	const expectedDist: DistMetadata = {
		[ 'src/index.js' ]: {
			esm: './dist/test-package.mjs',
			type: 'js',
			isBin: false
		},

		[ 'src/__bin__/whatever.js' ]: {
			esm: './dist/__bin__/whatever.mjs',
			type: 'js',
			isBin: true
		}
	};

	t.deepEqual( actualDist, expectedDist );
} );

// #116
test( 'packageParser() correctly detects bin source file with the .ts extension (complex bin format)', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'complexBin', 'complexBinTS' );
	const { dist: actualDist } = await packageParser( mockedPackagePath );
	const expectedDist: DistMetadata = {
		[ 'src/index.ts' ]: {
			esm: './dist/test-package.mjs',
			type: 'ts',
			tsConfig: 'tsconfig.json',
			isBin: false
		},

		[ 'src/__bin__/whatever.ts' ]: {
			esm: './dist/__bin__/whatever.mjs',
			type: 'ts',
			tsConfig: 'tsconfig.json',
			isBin: true
		}
	};

	t.deepEqual( actualDist, expectedDist );
} );

// #265
test( 'packageParser() correctly parses JS project with non-standard dist directory', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'nonStandardDist', 'js' );
	const actualMetadata = await packageParser( mockedPackagePath );
	const expectedMetadata: PackageMetadata = {
		project: mockedPackagePath,
		name: 'test-package',
		author: 'Comandeer',
		license: 'MIT',
		version: '9.0.1',
		dist: {
			[ 'src/index.js' ]: {
				esm: './hublabubla/test-package.mjs',
				type: 'js',
				isBin: false
			}
		},
		targets: {
			node: 'current'
		}
	};

	t.deepEqual( actualMetadata, expectedMetadata );
} );

// #265
test( 'packageParser() correctly parses TS project with non-standard dist directory', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'nonStandardDistTS', 'ts' );
	const { dist: actualDist } = await packageParser( mockedPackagePath );
	const expectedDist: DistMetadata = {
		[ 'src/index.ts' ]: {
			esm: './hublabubla/test-package.mjs',
			tsConfig: 'tsconfig.json',
			types: './hublabubla/test-package.d.ts',
			type: 'ts',
			isBin: false
		}
	};

	t.deepEqual( actualDist, expectedDist );
} );

// #265
test( 'packageParser() correctly detects bin source file with the .js extension (simple bin format, non-standard dist directory)', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'nonStandardDistSimpleBin', 'simpleBinJS' );
	const { dist: actualDist } = await packageParser( mockedPackagePath );
	const expectedDist: DistMetadata = {
		[ 'src/index.js' ]: {
			esm: './hublabubla/test-package.mjs',
			type: 'js',
			isBin: false
		},

		[ 'src/__bin__/test-package.js' ]: {
			esm: './hublabubla/__bin__/test-package.mjs',
			type: 'js',
			isBin: true
		}
	};

	t.deepEqual( actualDist, expectedDist );
} );

// #265
test( 'packageParser() correctly detects bin source file with the .ts extension (simple bin format, non-standard dist directory)', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'nonStandardDistSimpleBin', 'simpleBinTS' );
	const { dist: actualDist } = await packageParser( mockedPackagePath );
	const expectedDist: DistMetadata = {
		[ 'src/index.ts' ]: {
			esm: './hublabubla/test-package.mjs',
			type: 'ts',
			tsConfig: 'tsconfig.json',
			isBin: false
		},

		[ 'src/__bin__/test-package.ts' ]: {
			esm: './hublabubla/__bin__/test-package.mjs',
			type: 'ts',
			tsConfig: 'tsconfig.json',
			isBin: true
		}
	};

	t.deepEqual( actualDist, expectedDist );
} );

// #265
test( 'packageParser() correctly detects bin source file with the .js extension (complex bin format, non-standard dist directory)', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'nonStandardDistComplexBin', 'complexBinJS' );
	const { dist: actualDist } = await packageParser( mockedPackagePath );
	const expectedDist: DistMetadata = {
		[ 'src/index.js' ]: {
			esm: './hublabubla/test-package.mjs',
			type: 'js',
			isBin: false
		},

		[ 'src/__bin__/whatever.js' ]: {
			esm: './hublabubla/__bin__/whatever.mjs',
			type: 'js',
			isBin: true
		}
	};

	t.deepEqual( actualDist, expectedDist );
} );

// #265
test( 'packageParser() correctly detects bin source file with the .ts extension (complex bin format, non-standard dist directory)', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'nonStandardDistComplexBin', 'complexBinTS' );
	const { dist: actualDist } = await packageParser( mockedPackagePath );
	const expectedDist: DistMetadata = {
		[ 'src/index.ts' ]: {
			esm: './hublabubla/test-package.mjs',
			type: 'ts',
			tsConfig: 'tsconfig.json',
			isBin: false
		},

		[ 'src/__bin__/whatever.ts' ]: {
			esm: './hublabubla/__bin__/whatever.mjs',
			type: 'ts',
			tsConfig: 'tsconfig.json',
			isBin: true
		}
	};

	t.deepEqual( actualDist, expectedDist );
} );

// #275
test( 'packageParser() correctly parses package metadata when exports is a string (JS)', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'stringExports', 'js' );
	const { dist: actualDist } = await packageParser( mockedPackagePath );
	const expectedDist: DistMetadata = {
		[ 'src/index.js' ]: {
			esm: './dist/test-package.mjs',
			type: 'js',
			isBin: false
		}
	};

	t.deepEqual( actualDist, expectedDist );
} );

// #275
test( 'packageParser() correctly parses package metadata when exports is a string (TS)', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'stringExports', 'ts' );
	const { dist: actualDist } = await packageParser( mockedPackagePath );
	const expectedDist: DistMetadata = {
		[ 'src/index.ts' ]: {
			esm: './dist/test-package.mjs',
			type: 'ts',
			isBin: false,
			tsConfig: 'tsconfig.json'
		}
	};

	t.deepEqual( actualDist, expectedDist );
} );

// #275
test( 'packageParser() correctly parses package metadata when subpath exports are strings (JS)', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'stringSubPathExports', 'subPath' );
	const { dist: actualDist } = await packageParser( mockedPackagePath );
	const expectedDist: DistMetadata = {
		[ 'src/index.js' ]: {
			esm: './dist/test-package.mjs',
			type: 'js',
			isBin: false
		},
		[ 'src/chunk.mjs' ]: {
			esm: './dist/subpath.js',
			type: 'js',
			isBin: false
		}
	};

	t.deepEqual( actualDist, expectedDist );
} );

// #275
test( 'packageParser() correctly parses package metadata when subpath exports are strings (TS)', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'stringSubPathExports', 'tsSubPath' );
	const { dist: actualDist } = await packageParser( mockedPackagePath );
	const expectedDist: DistMetadata = {
		[ 'src/index.ts' ]: {
			esm: './dist/test-package.mjs',
			type: 'ts',
			isBin: false,
			tsConfig: 'tsconfig.json'
		},
		[ 'src/chunk.ts' ]: {
			esm: './dist/subpath.js',
			type: 'ts',
			isBin: false,
			tsConfig: 'tsconfig.json'
		}
	};

	t.deepEqual( actualDist, expectedDist );
} );

// #234
test( 'packageParser() correctly detects target Node version when the \'engines\' field is present', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'engines', 'js' );
	const { targets } = await packageParser( mockedPackagePath );
	const expectedTargets: PackageMetadataTargets = {
		node: '0.10.3'
	};

	t.deepEqual( targets, expectedTargets );
} );

// #234
test(
	'packageParser() fallbacks to \'current\' target Node version when ' +
	'the \'engines\' field has invalid value',
	async ( t ) => {
		const mockedPackagePath = getMockedPackagePath( 'enginesInvalid', 'js' );
		const { targets } = await packageParser( mockedPackagePath );
		const expectedTargets: PackageMetadataTargets = {
			node: 'current'
		};

		t.deepEqual( targets, expectedTargets );
	}
);

// #234
test(
	'packageParser() fallbacks to \'current\' target Node version when ' +
	'the \'engines\' field contains impossible condition',
	async ( t ) => {
		const mockedPackagePath = getMockedPackagePath( 'enginesImpossible', 'js' );
		const { targets } = await packageParser( mockedPackagePath );
		const expectedTargets: PackageMetadataTargets = {
			node: 'current'
		};

		t.deepEqual( targets, expectedTargets );
	}
);

async function parseMetadataAndGetDistInfo( mockedPackagePath: string, srcFile = 'src/index.js' ): Promise<SubPathMetadata> {
	const parsedMetadata = await packageParser( mockedPackagePath );

	return parsedMetadata.dist[ srcFile ]!;
}

interface MockedFSEntry {
	[x: string]: string | MockedFSEntry;
}

interface CreateMockedPackageOptions {
	stringify?: boolean;
}

type PackageJSONFixtureKey = keyof typeof packageJSONFixtures;
type SrcFixtureKey = keyof typeof srcFixtures;

function createMockedPackage( fixtureName: PackageJSONFixtureKey, srcFixtureName: SrcFixtureKey = 'js', {
	stringify = true
}: CreateMockedPackageOptions = {} ): MockedFSEntry {
	const mockedPackagePath = getMockedPackagePath( fixtureName, srcFixtureName );
	const packageJSON = stringify ? JSON.stringify( packageJSONFixtures[ fixtureName ] ) : packageJSONFixtures[ fixtureName ];
	const srcFixture = srcFixtures[ srcFixtureName ];

	return {
		[ mockedPackagePath ]: {
			'package.json': packageJSON,
			...srcFixture
		}
	};
}

function getMockedPackagePath( fixtureName: PackageJSONFixtureKey, srcFixtureName: SrcFixtureKey ): string {
	return `/${ fixtureName }-${ srcFixtureName }`;
}

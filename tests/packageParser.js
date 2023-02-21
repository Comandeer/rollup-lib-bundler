import test from 'ava';
import { resolve as resolvePath } from 'pathe';
import mockFS from 'mock-fs';
import packageParser from '../src/packageParser.js';

const fixtures = {
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
			import: './dist/test-package.mjs',
			require: './dist/test-package.cjs'
		}
	},

	validSubPathExports: {
		name: 'test-package',
		version: '1.0.0',
		exports: {
			'.': {
				'require': './dist/es5.cjs',
				'import': './dist/es6.mjs'
			},
			'./chunk': {
				'require': './dist/not-related-name.cjs',
				'import': './dist/also-not-related-name.js'
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
				'require': './dist/index.cjs',
				'import': './dist/index.mjs'
			},
			'./test/chunk': {
				'require': './dist/nested/chunk.cjs',
				'import': './dist/nested/chunk.mjs'
			}
		},
		author: 'Comandeer',
		license: 'ISC'
	},

	noCJSExports: {
		name: 'test-package',
		version: '9.0.1',
		author: 'Comandeer',
		license: 'MIT',
		exports: {
			import: './dist/test-package.mjs'
		}
	},

	noCJSSubPathExports: {
		name: 'test-package',
		version: '1.0.0',
		exports: {
			'.': {
				'import': './dist/es6.mjs'
			},
			'./chunk': {
				'import': './dist/also-not-related-name.js'
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
			import: './dist/test-package.mjs',
			require: './dist/test-package.cjs'
		}
	},

	noTypes: {
		name: 'test-package',
		version: '9.0.1',
		author: 'Comandeer',
		license: 'MIT',
		exports: {
			import: './dist/test-package.mjs',
			require: './dist/test-package.cjs'
		}
	},

	mixedProject: {
		name: 'test-package',
		version: '1.0.0',
		exports: {
			'.': {
				require: './dist/test-package.cjs',
				import: './dist/test-package.mjs',
				types: './dist/test-package.d.ts'
			},
			'./chunk': {
				require: './dist/chunk.cjs',
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
			import: './dist/test-package.mjs',
			require: './dist/test-package.cjs'
		}
	},

	exportsDotRequireOverExportsRequire: {
		name: 'test-package',
		version: '9.0.1',
		author: 'Comandeer',
		license: 'MIT',
		exports: {
			'.': {
				require: './dist/subpath.cjs'
			},
			import: './dist/test-package.mjs',
			require: './dist/test-package.cjs'
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
			import: './dist/test-package.mjs',
			require: './dist/test-package.cjs'
		}
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
	}
};
const INVALID_ARGUMENT_TYPE_ERROR = 'Provide a path to a package directory.';
const MISSING_PACKAGE_JSON_ERROR = 'The package.json does not exist in the provided location.';
const INVALID_PACKAGE_JSON_ERROR = 'The package.json file is not parsable as a correct JSON.';
const INVALID_ESM_METADATA_ERROR = 'Package metadata must contain one of "exports[ \'.\' ].import" or "exports.import" properties or all of them.';

test.before( () => {
	mockFS( {
		// We need to load node_modules to make sure that we can resolve dependencies.
		'node_modules': mockFS.load( resolvePath( __dirname, '../node_modules' ) ),
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
		...createMockedPackage( 'noCJSExports', 'js' ),
		...createMockedPackage( 'noCJSSubPathExports', 'subPath' ),
		...createMockedPackage( 'tsProject', 'ts' ),
		...createMockedPackage( 'tsProject', 'mts' ),
		...createMockedPackage( 'tsProject', 'tsConfig' ),
		...createMockedPackage( 'tsProject', 'noTSConfig' ),
		...createMockedPackage( 'exportsDotImportOverExportsImport', 'js' ),
		...createMockedPackage( 'exportsDotRequireOverExportsRequire', 'js' ),
		...createMockedPackage( 'authorAsObject', 'js' ),
		...createMockedPackage( 'mixedProject', 'mixedProject' ),
		...createMockedPackage( 'noTypes', 'ts' )
	} );
} );

test.after( mockFS.restore );

test( 'packageParser() is a function', ( t ) => {
	t.is( typeof packageParser, 'function' );
} );

test( 'packageParser() expects argument to be a path to a package directory', async ( t ) => {
	await t.throwsAsync( packageParser(), {
		instanceOf: TypeError,
		message: INVALID_ARGUMENT_TYPE_ERROR
	} );

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
	const expectedMetadata = {
		project: mockedPackagePath,
		name: 'test-package',
		author: 'Comandeer',
		license: 'MIT',
		version: '9.0.1',
		dist: {
			[ 'src/index.js' ]: {
				esm: './dist/test-package.mjs',
				cjs: './dist/test-package.cjs',
				type: 'js'
			}
		}
	};

	t.deepEqual( actualMetadata, expectedMetadata );
} );

// #185
test( 'packageParser() returns simplified metadata for package with subpath "exports" field', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'validSubPathExports', 'subPath' );
	const actualMetadata = await packageParser( mockedPackagePath );
	const expectedMetadata = {
		project: mockedPackagePath,
		name: 'test-package',
		author: 'Comandeer',
		license: 'ISC',
		version: '1.0.0',
		dist: {
			[ 'src/index.js' ]: {
				cjs: './dist/es5.cjs',
				esm: './dist/es6.mjs',
				type: 'js'
			},
			[ 'src/chunk.mjs' ]: {
				cjs: './dist/not-related-name.cjs',
				esm: './dist/also-not-related-name.js',
				type: 'js'
			}
		}
	};

	t.deepEqual( actualMetadata, expectedMetadata );
} );

// #215
test( 'packageParser() returns simplified metadata for package with no-CJS "exports" field', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'noCJSExports', 'js' );
	const actualMetadata = await packageParser( mockedPackagePath );
	const expectedMetadata = {
		project: mockedPackagePath,
		name: 'test-package',
		author: 'Comandeer',
		license: 'MIT',
		version: '9.0.1',
		dist: {
			[ 'src/index.js' ]: {
				esm: './dist/test-package.mjs',
				type: 'js'
			}
		}
	};

	t.deepEqual( actualMetadata, expectedMetadata );
} );

// #215
test( 'packageParser() returns simplified metadata for package with no-CJS subpath "exports" field', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'noCJSSubPathExports', 'subPath' );
	const actualMetadata = await packageParser( mockedPackagePath );
	const expectedMetadata = {
		project: mockedPackagePath,
		name: 'test-package',
		author: 'Comandeer',
		license: 'ISC',
		version: '1.0.0',
		dist: {
			[ 'src/index.js' ]: {
				esm: './dist/es6.mjs',
				type: 'js'
			},
			[ 'src/chunk.mjs' ]: {
				esm: './dist/also-not-related-name.js',
				type: 'js'
			}
		}
	};

	t.deepEqual( actualMetadata, expectedMetadata );
} );

// #185
test( 'packageParser() prefers exports[ \'.\' ].import over exports.import', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'exportsDotImportOverExportsImport', 'js' );
	const expectedDistPath = fixtures.exportsDotImportOverExportsImport.exports[ '.' ].import;
	const indexDistMetadata = await parseMetadataAndGetDistInfo( mockedPackagePath );
	const actualDistPath = indexDistMetadata.esm;

	t.is( actualDistPath, expectedDistPath );
} );

// #185
test( 'packageParser() prefers exports[ \'.\' ].require over exports.require', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'exportsDotRequireOverExportsRequire', 'js' );
	const expectedDistPath = fixtures.exportsDotRequireOverExportsRequire.exports[ '.' ].require;
	const indexDistMetadata = await parseMetadataAndGetDistInfo( mockedPackagePath );
	const actualDistPath = indexDistMetadata.cjs;

	t.is( actualDistPath, expectedDistPath );
} );

test( 'packageParser() parses author object into string', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'authorAsObject', 'js' );
	const expectedAuthor = fixtures.authorAsObject.author.name;
	const parsedMetadata = await packageParser( mockedPackagePath );
	const actualAuthor = parsedMetadata.author;

	t.is( actualAuthor, expectedAuthor );
} );

// #220
test( 'packageParser() correctly detects JS type with single .js entry point', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'validExports', 'js' );
	const { dist: actualDist } = await packageParser( mockedPackagePath );
	const expectedDist = {
		[ 'src/index.js' ]: {
			esm: './dist/test-package.mjs',
			cjs: './dist/test-package.cjs',
			type: 'js'
		}
	};

	t.deepEqual( actualDist, expectedDist );
} );

// #220
test( 'packageParser() correctly detects JS type with single .mjs entry point', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'validExports', 'mjs' );
	const { dist: actualDist } = await packageParser( mockedPackagePath );
	const expectedDist = {
		[ 'src/index.mjs' ]: {
			esm: './dist/test-package.mjs',
			cjs: './dist/test-package.cjs',
			type: 'js'
		}
	};

	t.deepEqual( actualDist, expectedDist );
} );

// #220
test( 'packageParser() correctly detects JS type with .mjs and .js entry point', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'validExports', 'mixedJS' );
	const { dist: actualDist } = await packageParser( mockedPackagePath );
	const expectedDist = {
		[ 'src/index.mjs' ]: {
			esm: './dist/test-package.mjs',
			cjs: './dist/test-package.cjs',
			type: 'js'
		}
	};

	t.deepEqual( actualDist, expectedDist );
} );

// #220
test( 'packageParser() correctly detects JS type with single .js entry point and single .mjs subexport', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'validSubPathExports', 'subPath' );
	const { dist: actualDist } = await packageParser( mockedPackagePath );
	const expectedDist = {
		[ 'src/index.js' ]: {
			esm: './dist/es6.mjs',
			cjs: './dist/es5.cjs',
			type: 'js'
		},

		[ 'src/chunk.mjs' ]: {
			esm: './dist/also-not-related-name.js',
			cjs: './dist/not-related-name.cjs',
			type: 'js'
		}
	};

	t.deepEqual( actualDist, expectedDist );
} );

// #220
test( 'packageParser() correctly detects JS type with single .js entry point and single .mjs nested subexport', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'nestedSubPathExports', 'nestedSubPath' );
	const { dist: actualDist } = await packageParser( mockedPackagePath );
	const expectedDist = {
		[ 'src/index.js' ]: {
			esm: './dist/index.mjs',
			cjs: './dist/index.cjs',
			type: 'js'
		},

		[ 'src/test/chunk.mjs' ]: {
			esm: './dist/nested/chunk.mjs',
			cjs: './dist/nested/chunk.cjs',
			type: 'js'
		}
	};

	t.deepEqual( actualDist, expectedDist );
} );

// #220
test( 'packageParser() correctly detects TS type with single .ts entry point', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'tsProject', 'ts' );
	const { dist: actualDist } = await packageParser( mockedPackagePath );
	const expectedDist = {
		[ 'src/index.ts' ]: {
			esm: './dist/test-package.mjs',
			cjs: './dist/test-package.cjs',
			tsConfig: 'tsconfig.json',
			types: './dist/test-package.d.ts',
			type: 'ts'
		}
	};

	t.deepEqual( actualDist, expectedDist );
} );

// #220
test( 'packageParser() correctly detects TS type with single .mts entry point', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'tsProject', 'mts' );
	const { dist: actualDist } = await packageParser( mockedPackagePath );
	const expectedDist = {
		[ 'src/index.mts' ]: {
			esm: './dist/test-package.mjs',
			cjs: './dist/test-package.cjs',
			tsConfig: 'tsconfig.json',
			types: './dist/test-package.d.ts',
			type: 'ts'
		}
	};

	t.deepEqual( actualDist, expectedDist );
} );

// #220
test( 'packageParser() correctly detects mixed JS/TS projects', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'mixedProject', 'mixedProject' );
	const { dist: actualDist } = await packageParser( mockedPackagePath );
	const expectedDist = {
		[ 'src/index.ts' ]: {
			esm: './dist/test-package.mjs',
			cjs: './dist/test-package.cjs',
			types: './dist/test-package.d.ts',
			tsConfig: 'tsconfig.json',
			type: 'ts'
		},

		[ 'src/chunk.mjs' ]: {
			esm: './dist/chunk.mjs',
			cjs: './dist/chunk.cjs',
			type: 'js'
		}
	};

	t.deepEqual( actualDist, expectedDist );
} );

test( 'packageParser() prefers ts.config.rlb.json file over tsconfig.json one in TS projects', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'tsProject', 'tsConfig' );
	const { dist: actualDist } = await packageParser( mockedPackagePath );
	const expectedDist = {
		[ 'src/index.ts' ]: {
			esm: './dist/test-package.mjs',
			cjs: './dist/test-package.cjs',
			tsConfig: 'tsconfig.rlb.json',
			types: './dist/test-package.d.ts',
			type: 'ts'
		}
	};

	t.deepEqual( actualDist, expectedDist );
} );

test( 'packageParser() skips tsConfig metadata if there is no tsconfig?(.rlb).json file in TS projects', async ( t ) => {
	const mockedPackagePath = getMockedPackagePath( 'tsProject', 'noTSConfig' );
	const { dist: actualDist } = await packageParser( mockedPackagePath );
	const expectedDist = {
		[ 'src/index.ts' ]: {
			esm: './dist/test-package.mjs',
			cjs: './dist/test-package.cjs',
			types: './dist/test-package.d.ts',
			type: 'ts'
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
			cjs: './dist/test-package.cjs',
			tsConfig: 'tsconfig.json',
			type: 'ts'
		}
	} ;

	t.deepEqual( actualDist, expectedDist );
} );

async function parseMetadataAndGetDistInfo( mockedPackagePath, srcFile = 'src/index.js' ) {
	const parsedMetadata = await packageParser( mockedPackagePath );

	return parsedMetadata.dist[ srcFile ];
}

function createMockedPackage( fixtureName, srcFixtureName = 'js', {
	stringify = true
} = {} ) {
	const mockedPackagePath = getMockedPackagePath( fixtureName, srcFixtureName );
	const packageJSON = stringify ? JSON.stringify( fixtures[ fixtureName ] ) : fixtures[ fixtureName ];
	const srcFixture = srcFixtures[ srcFixtureName ];

	return {
		[ mockedPackagePath ]: {
			'package.json': packageJSON,
			...srcFixture
		}
	};
}

function getMockedPackagePath( fixtureName, srcFixtureName ) {
	return `/${ fixtureName }-${ srcFixtureName }`;
}

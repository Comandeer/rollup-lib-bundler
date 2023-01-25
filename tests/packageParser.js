import { resolve as resolvePath } from 'node:path';
import { sep as pathSeparator } from 'node:path';
import mockFS from 'mock-fs';
import packageParser from '../src/packageParser.js';
import { deepClone } from './__helpers__/utils';

const fixtures = {
	valid: {
		'name': 'test-package',
		'version': '9.0.1',
		'author': 'Comandeer',
		'license': 'MIT',
		'main': 'dist/es5.js',
		'module': 'dist/es2015.js'
	},

	validExports: {
		'name': 'test-package',
		'version': '9.0.1',
		'author': 'Comandeer',
		'license': 'MIT',
		'exports': {
			'import': 'dist/test-package.mjs',
			'require': 'dist/test-package.cjs'
		}
	},

	validSubPathExports: {
		'name': 'test-package',
		'private': true,
		'version': '1.0.0',
		'description': 'Test package',
		'exports': {
			'.': {
				'require': './dist/es5.cjs',
				'import': './dist/es6.mjs'
			},
			'./chunk': {
				'require': './dist/not-related-name.cjs',
				'import': './dist/also-not-related-name.js'
			}
		},
		'author': 'Comandeer',
		'license': 'ISC'
	},

	nestedSubPathExports: {
		'name': 'test-package',
		'private': true,
		'version': '1.0.0',
		'description': 'Test package',
		'exports': {
			'.': {
				'require': './dist/index.cjs',
				'import': './dist/index.mjs'
			},
			'./test/chunk': {
				'require': './dist/nested/chunk.cjs',
				'import': './dist/nested/chunk.mjs'
			}
		},
		'author': 'Comandeer',
		'license': 'ISC'
	},

	noCJSExports: {
		'name': 'test-package',
		'version': '9.0.1',
		'author': 'Comandeer',
		'license': 'MIT',
		'exports': {
			'import': './dist/test-package.mjs'
		}
	},

	noCJSSubPathExports: {
		'name': 'test-package',
		'private': true,
		'version': '1.0.0',
		'description': 'Test package',
		'exports': {
			'.': {
				'import': './dist/es6.mjs'
			},
			'./chunk': {
				'import': './dist/also-not-related-name.js'
			}
		},
		'author': 'Comandeer',
		'license': 'ISC'
	},

	tsProject: {
		'name': 'test-package',
		'version': '9.0.1',
		'author': 'Comandeer',
		'license': 'MIT',
		'exports': {
			'types': 'dist/test-package.d.ts',
			'import': 'dist/test-package.mjs',
			'require': 'dist/test-package.cjs'
		}
	},

	tsFallbacks: {
		'name': 'test-package',
		'version': '9.0.1',
		'author': 'Comandeer',
		'license': 'MIT',
		'types': 'dist/test-package.d.ts',
		'module': 'dist/test-package.mjs',
		'main': 'dist/test-package.cjs'
	},

	mixedProject: {
		'name': 'test-package',
		'private': true,
		'version': '1.0.0',
		'description': 'Test package',
		'exports': {
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
		'author': 'Comandeer',
		'license': 'ISC'
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

const mockedPackagePath = '/some-package';

const INVALID_ARGUMENT_TYPE_ERROR = 'Provide a path to a package directory.';
const MISSING_PACKAGE_JSON_ERROR = 'The package.json does not exist in the provided location.';
const INVALID_PACKAGE_JSON_ERROR = 'The package.json file is not parsable as a correct JSON.';
const INVALID_ESM_METADATA_ERROR = 'Package metadata must contain one of "exports[ \'.\' ].import", "exports.import", "module" or "jsnext:main" properties or all of them.';

describe( 'packageParser', () => {
	afterEach( mockFS.restore );

	it( 'is a function', () => {
		expect( packageParser ).to.be.a( 'function' );
	} );

	it( 'expects argument to be a path to a package directory', async () => {
		await expect( packageParser() ).to.be.rejectedWith( TypeError, INVALID_ARGUMENT_TYPE_ERROR );

		await expect( packageParser( 1 ) ).to.be.rejectedWith( TypeError, INVALID_ARGUMENT_TYPE_ERROR );
	} );

	it( 'resolves package.json from the given directory', async () => {
		mockPackage( JSON.stringify( fixtures.valid ) );

		await expect( await packageParser( mockedPackagePath ) ).to.be.an( 'object' );
	} );

	it( 'throws when package.json does not exist in the given directory', async () => {
		mockPackage( JSON.stringify( fixtures.valid ) );

		await expect( packageParser( 'non-existent' ) ).to.be.rejectedWith(
			ReferenceError, MISSING_PACKAGE_JSON_ERROR );
	} );

	it( 'throws when package.json is not a valid JSON', async () => {
		mockPackage( '' );

		await expect( packageParser( mockedPackagePath ) ).to.be.rejectedWith(
			SyntaxError, INVALID_PACKAGE_JSON_ERROR );
	} );

	describe( 'linting the package.json metadata', () => {
		it( 'requires the name property', async () => {
			mockPackage( JSON.stringify( {} ) );

			await expect( packageParser( mockedPackagePath ) ).to.be.rejectedWith(
				ReferenceError, 'Package metadata must contain "name" property.' );
		} );

		it( 'requires the version property', async () => {
			mockPackage( JSON.stringify( {
				name: 'test'
			} ) );

			await expect( packageParser( mockedPackagePath ) ).to.be.rejectedWith(
				ReferenceError, 'Package metadata must contain "version" property.' );
		} );

		it( 'requires one of the ESM output properties', async () => {
			mockPackage( JSON.stringify(  {
				name: 'test',
				version: '0.0.0',
				main: 'test'
			} ) );

			await expect( packageParser( mockedPackagePath ) ).to.be.rejectedWith(
				ReferenceError, INVALID_ESM_METADATA_ERROR );
		} );

		it( 'requires the author property', async () => {
			mockPackage( JSON.stringify( {
				name: 'test',
				version: '0.0.0',
				main: 'test',
				module: 'test'
			} ) );

			await expect( packageParser( mockedPackagePath ) ).to.be.rejectedWith( ReferenceError, 'Package metadata must contain "author" property.' );
		} );

		it( 'requires the license property', async () => {
			mockPackage( JSON.stringify(  {
				name: 'test',
				version: '0.0.0',
				main: 'test',
				module: 'test',
				author: 'test'
			} ) );

			await expect( packageParser( mockedPackagePath ) ).to.be.rejectedWith(
				ReferenceError, 'Package metadata must contain "license" property.' );
		} );
	} );

	// #61
	it( 'requires module or jsnext:main if exports does not contain import property', async () => {
		mockPackage( JSON.stringify( {
			name: 'test',
			version: '0.0.0',
			exports: {
				require: 'dist/whatever.js'
			}
		} ) );

		await expect( packageParser( mockedPackagePath ) ).to.be.rejectedWith(
			ReferenceError, INVALID_ESM_METADATA_ERROR );
	} );

	it( 'returns simplified metadata', async () => {
		mockPackage( JSON.stringify( fixtures.valid ) );

		expect( await packageParser( mockedPackagePath ) ).to.deep.equal( {
			project: mockedPackagePath,
			name: 'test-package',
			author: 'Comandeer',
			license: 'MIT',
			version: '9.0.1',
			dist: {
				[ `src${ pathSeparator }index.js` ]: {
					esm: 'dist/es2015.js',
					cjs: 'dist/es5.js',
					type: 'js'
				}
			}
		} );
	} );

	// #61
	it( 'returns simplified metadata for package with "exports" field', async () => {
		mockPackage( JSON.stringify( fixtures.validExports ) );

		expect( await packageParser( mockedPackagePath ) ).to.deep.equal( {
			project: mockedPackagePath,
			name: 'test-package',
			author: 'Comandeer',
			license: 'MIT',
			version: '9.0.1',
			dist: {
				[ `src${ pathSeparator }index.js` ]: {
					esm: 'dist/test-package.mjs',
					cjs: 'dist/test-package.cjs',
					type: 'js'
				}
			}
		} );
	} );

	// #185
	it( 'returns simplified metadata for package with subpath "exports" field', async () => {
		mockPackage( JSON.stringify( fixtures.validSubPathExports ), srcFixtures.subPath );

		expect( await packageParser( mockedPackagePath ) ).to.deep.equal( {
			project: mockedPackagePath,
			name: 'test-package',
			author: 'Comandeer',
			license: 'ISC',
			version: '1.0.0',
			dist: {
				[ `src${ pathSeparator }index.js` ]: {
					cjs: './dist/es5.cjs',
					esm: './dist/es6.mjs',
					type: 'js'
				},
				[ `src${ pathSeparator }chunk.mjs` ]: {
					cjs: './dist/not-related-name.cjs',
					esm: './dist/also-not-related-name.js',
					type: 'js'
				}
			}
		} );
	} );

	// #215
	it( 'returns simplified metadata for package with no-CJS "exports" field', async () => {
		mockPackage( JSON.stringify( fixtures.noCJSExports ) );

		expect( await packageParser( mockedPackagePath ) ).to.deep.equal( {
			project: mockedPackagePath,
			name: 'test-package',
			author: 'Comandeer',
			license: 'MIT',
			version: '9.0.1',
			dist: {
				[ `src${ pathSeparator }index.js` ]: {
					esm: './dist/test-package.mjs',
					type: 'js'
				}
			}
		} );
	} );

	// #215
	it( 'returns simplified metadata for package with no-CJS subpath "exports" field', async () => {
		mockPackage( JSON.stringify( fixtures.noCJSSubPathExports ), srcFixtures.subPath );

		expect( await packageParser( mockedPackagePath ) ).to.deep.equal( {
			project: mockedPackagePath,
			name: 'test-package',
			author: 'Comandeer',
			license: 'ISC',
			version: '1.0.0',
			dist: {
				[ `src${ pathSeparator }index.js` ]: {
					esm: './dist/es6.mjs',
					type: 'js'
				},
				[ `src${ pathSeparator }chunk.mjs` ]: {
					esm: './dist/also-not-related-name.js',
					type: 'js'
				}
			}
		} );
	} );

	// #185
	it( 'prefers exports[ \'.\' ].import over exports.import', async () => {
		const distPath = 'dist/subpath.mjs';
		const module = deepClone( fixtures.validExports );

		module.exports[ '.' ] = {
			import: distPath
		};

		const indexDistMetadata = await parseMetadataAndGetDistInfo( module );

		expect( indexDistMetadata.esm ).to.equal( distPath );
	} );

	// #185
	it( 'prefers exports[ \'.\' ].require over exports.require', async () => {
		const distPath = `dist${ pathSeparator }subpath.cjs`;
		const module = deepClone( fixtures.validExports );

		module.exports[ '.' ] = {
			require: distPath
		};

		const indexDistMetadata = await parseMetadataAndGetDistInfo( module );

		expect( indexDistMetadata.cjs ).to.equal( distPath );
	} );

	// #61
	it( 'prefers exports.import over module', async () => {
		const module = deepClone( fixtures.validExports );

		module.module = 'dist/es2015.js';

		const indexDistMetadata = await parseMetadataAndGetDistInfo( module );

		expect( indexDistMetadata.esm ).to.equal( 'dist/test-package.mjs' );
	} );

	// #61
	it( 'prefers exports.require over main', async () => {
		const module = deepClone( fixtures.validExports );

		module.main = 'dist/es5.js';

		const indexDistMetadata = await parseMetadataAndGetDistInfo( module );

		expect( indexDistMetadata.cjs ).to.equal( 'dist/test-package.cjs' );
	} );

	it( 'prefers module over jsnext:main', async () => {
		const module = deepClone( fixtures.valid );

		module[ 'jsnext:main' ] = 'dist/esnext.js';

		const indexDistMetadata = await parseMetadataAndGetDistInfo( module );

		expect( indexDistMetadata.esm ).to.equal( 'dist/es2015.js' );
	} );

	// #61
	it( 'uses module when exports.import is not available', async () => {
		const module = deepClone( fixtures.validExports );

		module.module = 'dist/module.js';
		delete module.exports.import;

		const indexDistMetadata = await parseMetadataAndGetDistInfo( module );

		expect( indexDistMetadata.esm ).to.equal( 'dist/module.js' );
	} );

	// #61
	it( 'uses jsnext:main when both exports.import and module are not available', async () => {
		const module = deepClone( fixtures.validExports );

		module[ 'jsnext:main' ] = 'dist/jsnext.js';
		delete module.exports.import;

		const indexDistMetadata = await parseMetadataAndGetDistInfo( module );

		expect( indexDistMetadata.esm ).to.equal( 'dist/jsnext.js' );
	} );

	// #61
	it( 'uses main when exports.require is not available', async () => {
		const module = deepClone( fixtures.validExports );

		module.main = 'dist/legacy.js';
		delete module.exports.require;

		const indexDistMetadata = await parseMetadataAndGetDistInfo( module );

		expect( indexDistMetadata.cjs ).to.equal( 'dist/legacy.js' );
	} );

	it( 'uses jsnext:main when module is not available', async () => {
		const module = deepClone( fixtures.valid );

		module[ 'jsnext:main' ] = 'dist/esnext.js';
		delete module.module;

		const indexDistMetadata = await parseMetadataAndGetDistInfo( module );

		expect( indexDistMetadata.esm ).to.equal( 'dist/esnext.js' );
	} );

	it( 'parses author object into string', async () => {
		const author = deepClone( fixtures.valid );

		author.author = {
			name: 'Tester'
		};

		mockPackage( JSON.stringify( author ) );

		const parsedMetadata = await packageParser( mockedPackagePath );

		expect( parsedMetadata.author ).to.equal( 'Tester' );
	} );

	// #220
	describe( 'detecting entrypoints type', () => {
		it( 'correctly detects JS type with single .js entry point', async () => {
			mockPackage( JSON.stringify( fixtures.validExports ) );

			const { dist } = await packageParser( mockedPackagePath );

			expect( dist ).to.deep.equal( {
				[ `src${ pathSeparator }index.js` ]: {
					esm: 'dist/test-package.mjs',
					cjs: 'dist/test-package.cjs',
					type: 'js'
				}
			} );
		} );

		it( 'correctly detects JS type with single .mjs entry point', async () => {
			mockPackage( JSON.stringify( fixtures.validExports ), srcFixtures.mjs );

			const { dist } = await packageParser( mockedPackagePath );

			expect( dist ).to.deep.equal( {
				[ `src${ pathSeparator }index.mjs` ]: {
					esm: 'dist/test-package.mjs',
					cjs: 'dist/test-package.cjs',
					type: 'js'
				}
			} );
		} );

		it( 'correctly detects JS type with .mjs and .js entry point', async () => {
			const mixedJSSrcFixture = { ...srcFixtures.js, ...srcFixtures.mjs };
			mockPackage( JSON.stringify( fixtures.validExports ), mixedJSSrcFixture );

			const { dist } = await packageParser( mockedPackagePath );

			expect( dist ).to.deep.equal( {
				[ `src${ pathSeparator }index.mjs` ]: {
					esm: 'dist/test-package.mjs',
					cjs: 'dist/test-package.cjs',
					type: 'js'
				}
			} );
		} );

		it( 'correctly detects JS type with single .js entry point and single .mjs subexport', async () => {
			mockPackage( JSON.stringify( fixtures.validSubPathExports ), srcFixtures.subPath );

			const { dist } = await packageParser( mockedPackagePath );

			expect( dist ).to.deep.equal( {
				[ `src${ pathSeparator }index.js` ]: {
					esm: './dist/es6.mjs',
					cjs: './dist/es5.cjs',
					type: 'js'
				},

				[ `src${ pathSeparator }chunk.mjs` ]: {
					esm: './dist/also-not-related-name.js',
					cjs: './dist/not-related-name.cjs',
					type: 'js'
				}
			} );
		} );

		it( 'correctly detects JS type with single .js entry point and single .mjs nested subexport', async () => {
			mockPackage( JSON.stringify( fixtures.nestedSubPathExports ), srcFixtures.nestedSubPath );

			const { dist } = await packageParser( mockedPackagePath );

			expect( dist ).to.deep.equal( {
				[ `src${ pathSeparator }index.js` ]: {
					esm: './dist/index.mjs',
					cjs: './dist/index.cjs',
					type: 'js'
				},

				[ `src${ pathSeparator }test${ pathSeparator }chunk.mjs` ]: {
					esm: './dist/nested/chunk.mjs',
					cjs: './dist/nested/chunk.cjs',
					type: 'js'
				}
			} );
		} );

		it( 'correctly detects TS type with single .ts entry point', async () => {
			mockPackage( JSON.stringify( fixtures.tsProject ), srcFixtures.ts );

			const { dist } = await packageParser( mockedPackagePath );

			expect( dist ).to.deep.equal( {
				[ `src${ pathSeparator }index.ts` ]: {
					esm: 'dist/test-package.mjs',
					cjs: 'dist/test-package.cjs',
					tsConfig: 'tsconfig.json',
					types: 'dist/test-package.d.ts',
					type: 'ts'
				}
			} );
		} );

		it( 'correctly detects TS type with single .mts entry point', async () => {
			mockPackage( JSON.stringify( fixtures.tsProject ), srcFixtures.mts );

			const { dist } = await packageParser( mockedPackagePath );

			expect( dist ).to.deep.equal( {
				[ `src${ pathSeparator }index.mts` ]: {
					esm: 'dist/test-package.mjs',
					cjs: 'dist/test-package.cjs',
					tsConfig: 'tsconfig.json',
					types: 'dist/test-package.d.ts',
					type: 'ts'
				}
			} );
		} );

		it( 'correctly detects mixed JS/TS projects', async () => {
			mockPackage( JSON.stringify( fixtures.mixedProject ), srcFixtures.mixedProject );

			const { dist } = await packageParser( mockedPackagePath );

			expect( dist ).to.deep.equal( {
				[ `src${ pathSeparator }index.ts` ]: {
					esm: './dist/test-package.mjs',
					cjs: './dist/test-package.cjs',
					types: './dist/test-package.d.ts',
					tsConfig: 'tsconfig.json',
					type: 'ts'
				},

				[ `src${ pathSeparator }chunk.mjs` ]: {
					esm: './dist/chunk.mjs',
					cjs: './dist/chunk.cjs',
					type: 'js'
				}
			} );
		} );
	} );

	describe( 'parsing TS metadata', () => {
		it( 'prefers ts.config.rlb.json file over tsconfig.json one', async () => {
			mockPackage( JSON.stringify( fixtures.tsProject ), srcFixtures.tsConfig );

			const { dist } = await packageParser( mockedPackagePath );

			expect( dist ).to.deep.equal( {
				[ `src${ pathSeparator }index.ts` ]: {
					esm: 'dist/test-package.mjs',
					cjs: 'dist/test-package.cjs',
					tsConfig: 'tsconfig.rlb.json',
					types: 'dist/test-package.d.ts',
					type: 'ts'
				}
			} );
		} );

		it( 'skips tsConfig metadata if there is no tsconfig?(.rlb).json file', async () => {
			mockPackage( JSON.stringify( fixtures.tsProject ), srcFixtures.noTSConfig );

			const { dist } = await packageParser( mockedPackagePath );

			expect( dist ).to.deep.equal( {
				[ `src${ pathSeparator }index.ts` ]: {
					esm: 'dist/test-package.mjs',
					cjs: 'dist/test-package.cjs',
					types: 'dist/test-package.d.ts',
					type: 'ts'
				}
			} );
		} );

		it( 'skips types metadata if there is no exports.types field', async () => {
			const noTypesFixture = { ...fixtures.tsProject };

			delete noTypesFixture.exports.types;

			mockPackage( JSON.stringify( noTypesFixture ), srcFixtures.ts );

			const { dist } = await packageParser( mockedPackagePath );

			expect( dist ).to.deep.equal( {
				[ `src${ pathSeparator }index.ts` ]: {
					esm: 'dist/test-package.mjs',
					cjs: 'dist/test-package.cjs',
					tsConfig: 'tsconfig.json',
					type: 'ts'
				}
			} );
		} );

		it( 'correctly parses TS project with fallback values', async () => {
			mockPackage( JSON.stringify( fixtures.tsFallbacks ), srcFixtures.ts );

			const { dist } = await packageParser( mockedPackagePath );

			expect( dist ).to.deep.equal( {
				[ `src${ pathSeparator }index.ts` ]: {
					esm: 'dist/test-package.mjs',
					cjs: 'dist/test-package.cjs',
					tsConfig: 'tsconfig.json',
					types: 'dist/test-package.d.ts',
					type: 'ts'
				}
			} );
		} );
	} );
} );

async function parseMetadataAndGetDistInfo( metadata, srcFile = `src${ pathSeparator }index.js` ) {
	mockPackage( JSON.stringify( metadata ) );

	const parsedMetadata = await packageParser( mockedPackagePath );

	return parsedMetadata.dist[ srcFile ];
}

function mockPackage( packageJSON, srcFixture = srcFixtures.js ) {
	mockFS( {
		// We need to load node_modules to make sure that we can resolve dependencies.
		'node_modules': mockFS.load( resolvePath( __dirname, '../node_modules' ) ),
		[ mockedPackagePath ]: {
			'package.json': packageJSON,
			...srcFixture
		}
	} );
}

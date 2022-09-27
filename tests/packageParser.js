import { resolve as resolvePath } from 'path';
import { sep as pathSeparator } from 'path';
import valid from './__fixtures__/packageParser/valid.json';
import validExports from './__fixtures__/packageParser/validExports.json';
import validSubPathExports from './__fixtures__/packageParser/validSubPathExports.json';
import packageParser from '../src/packageParser.js';
import { deepClone } from './__helpers__/utils';

const fixturesPath = resolvePath( __dirname, '__fixtures__', 'packageParser' );
const validFixturePath = resolvePath( fixturesPath, 'valid.json' );
const invalidFixturePath = resolvePath( fixturesPath, 'invalid.json' );
const noCJSExportsFixturePath = resolvePath( fixturesPath, 'noCJSExports.json' );
const noCJSSubPathExportsFixturePath = resolvePath( fixturesPath, 'noCJSSubPathExports.json' );
const invalidESMMetdataError = 'Package metadata must contain one of "exports[ \'.\' ].import", "exports.import", "module" or "jsnext:main" properties or all of them.';

describe( 'packageParser', () => {
	it( 'is a function', () => {
		expect( packageParser ).to.be.a( 'function' );
	} );

	it( 'expects string or object', async () => {
		await expect( packageParser() ).to.be.rejectedWith( TypeError, 'Provide string or object.' );

		await expect( packageParser( 1 ) ).to.be.rejectedWith( TypeError, 'Provide string or object.' );
	} );

	it( 'treats string as path to JSON file', async () => {
		await expect( await packageParser( validFixturePath ) ).to.be.an( 'object' );

		await expect( packageParser( 'non-existent.json' ) ).to.be.rejectedWith(
			ReferenceError, 'File with given path does not exist.' );

		await expect( packageParser( invalidFixturePath ) ).to.be.rejectedWith(
			SyntaxError, 'Given file is not parsable as a correct JSON.' );
	} );

	it( 'treats object as loaded package.json file', async () => {
		expect( await packageParser( valid ) ).to.be.an( 'object' );
	} );

	it( 'requires certain properties', async () => {
		await expect( packageParser( {} ) ).to.be.rejectedWith(
			ReferenceError, 'Package metadata must contain "name" property.' );

		await expect( packageParser( {
			name: 'test'
		} ) ).to.be.rejectedWith( ReferenceError, 'Package metadata must contain "version" property.' );

		await expect( packageParser( {
			name: 'test',
			version: '0.0.0',
			main: 'test'
		} ) ).to.be.rejectedWith( ReferenceError, invalidESMMetdataError );

		await expect( packageParser( {
			name: 'test',
			version: '0.0.0',
			main: 'test',
			module: 'test'
		} ) ).to.be.rejectedWith( ReferenceError, 'Package metadata must contain "author" property.' );

		await expect( packageParser( {
			name: 'test',
			version: '0.0.0',
			main: 'test',
			module: 'test',
			author: 'test'
		} ) ).to.be.rejectedWith( ReferenceError, 'Package metadata must contain "license" property.' );
	} );

	// #61
	it( 'requires module or jsnext:main if exports does not contain import property', async () => {
		await expect( packageParser( {
			name: 'test',
			version: '0.0.0',
			exports: {
				require: 'dist/whatever.js'
			}
		} ) ).to.be.rejectedWith( ReferenceError, invalidESMMetdataError );
	} );

	it( 'returns simplified metadata', async () => {
		expect( await packageParser( valid ) ).to.deep.equal( {
			name: 'test-package',
			author: 'Comandeer',
			license: 'MIT',
			version: '9.0.1',
			dist: {
				[ `src${ pathSeparator }index.js` ]: {
					esm: 'dist/es2015.js',
					cjs: 'dist/es5.js'
				}
			}
		} );
	} );

	// #61
	it( 'returns simplified metadata for package with "exports" field', async () => {
		expect( await packageParser( validExports ) ).to.deep.equal( {
			name: 'test-package',
			author: 'Comandeer',
			license: 'MIT',
			version: '9.0.1',
			dist: {
				[ `src${ pathSeparator }index.js` ]: {
					esm: 'dist/test-package.mjs',
					cjs: 'dist/test-package.cjs'
				}
			}
		} );
	} );

	// #185
	it( 'returns simplified metadata for package with subpath "exports" field', async () => {
		expect( await packageParser( validSubPathExports ) ).to.deep.equal( {
			name: 'test-package',
			author: 'Comandeer',
			license: 'ISC',
			version: '1.0.0',
			dist: {
				[ `src${ pathSeparator }index.js` ]: {
					cjs: './dist/es5.cjs',
					esm: './dist/es6.mjs'
				},
				[ `src${ pathSeparator }chunk.js` ]: {
					cjs: './dist/not-related-name.cjs',
					esm: './dist/also-not-related-name.js'
				}
			}
		} );
	} );

	// #215
	it( 'returns simplified metadata for package with no-CJS "exports" field', async () => {
		expect( await packageParser( noCJSExportsFixturePath ) ).to.deep.equal( {
			name: 'test-package',
			author: 'Comandeer',
			license: 'MIT',
			version: '9.0.1',
			dist: {
				[ `src${ pathSeparator }index.js` ]: {
					esm: './dist/test-package.mjs'
				}
			}
		} );
	} );

	// #215
	it( 'returns simplified metadata for package with no-CJS subpath "exports" field', async () => {
		expect( await packageParser( noCJSSubPathExportsFixturePath ) ).to.deep.equal( {
			name: 'test-package',
			author: 'Comandeer',
			license: 'ISC',
			version: '1.0.0',
			dist: {
				[ `src${ pathSeparator }index.js` ]: {
					esm: './dist/es6.mjs'
				},
				[ `src${ pathSeparator }chunk.js` ]: {
					esm: './dist/also-not-related-name.js'
				}
			}
		} );
	} );

	// #185
	it( 'prefers exports[ \'.\' ].import over exports.import', async () => {
		const distPath = 'dist/subpath.mjs';
		const module = deepClone( validExports );
		module.exports[ '.' ] = {
			import: distPath
		};
		const indexDistMetadata = await parseMetadataAndGetDistInfo( module );

		expect( indexDistMetadata.esm ).to.equal( distPath );
	} );

	// #185
	it( 'prefers exports[ \'.\' ].require over exports.require', async () => {
		const distPath = `dist${ pathSeparator }subpath.cjs`;
		const module = deepClone( validExports );
		module.exports[ '.' ] = {
			require: distPath
		};
		const indexDistMetadata = await parseMetadataAndGetDistInfo( module );

		expect( indexDistMetadata.cjs ).to.equal( distPath );
	} );

	// #61
	it( 'prefers exports.import over module', async () => {
		const module = deepClone( validExports );
		module.module = 'dist/es2015.js';
		const indexDistMetadata = await parseMetadataAndGetDistInfo( module );

		expect( indexDistMetadata.esm ).to.equal( 'dist/test-package.mjs' );
	} );

	// #61
	it( 'prefers exports.require over main', async () => {
		const module = deepClone( validExports );
		module.main = 'dist/es5.js';
		const indexDistMetadata = await parseMetadataAndGetDistInfo( module );

		expect( indexDistMetadata.cjs ).to.equal( 'dist/test-package.cjs' );
	} );

	it( 'prefers module over jsnext:main', async () => {
		const module = deepClone( valid );
		module[ 'jsnext:main' ] = 'dist/esnext.js';
		const indexDistMetadata = await parseMetadataAndGetDistInfo( module );

		expect( indexDistMetadata.esm ).to.equal( 'dist/es2015.js' );
	} );

	// #61
	it( 'uses module when exports.import is not available', async () => {
		const module = deepClone( validExports );
		module.module = 'dist/module.js';
		delete module.exports.import;
		const indexDistMetadata = await parseMetadataAndGetDistInfo( module );

		expect( indexDistMetadata.esm ).to.equal( 'dist/module.js' );
	} );

	// #61
	it( 'uses jsnext:main when both exports.import and module are not available', async () => {
		const module = deepClone( validExports );
		module[ 'jsnext:main' ] = 'dist/jsnext.js';
		delete module.exports.import;
		const indexDistMetadata = await parseMetadataAndGetDistInfo( module );

		expect( indexDistMetadata.esm ).to.equal( 'dist/jsnext.js' );
	} );

	// #61
	it( 'uses main when exports.require is not available', async () => {
		const module = deepClone( validExports );
		module.main = 'dist/legacy.js';
		delete module.exports.require;
		const indexDistMetadata = await parseMetadataAndGetDistInfo( module );

		expect( indexDistMetadata.cjs ).to.equal( 'dist/legacy.js' );
	} );

	it( 'uses jsnext:main when module is not available', async () => {
		const module = deepClone( valid );
		module[ 'jsnext:main' ] = 'dist/esnext.js';
		delete module.module;
		const indexDistMetadata = await parseMetadataAndGetDistInfo( module );

		expect( indexDistMetadata.esm ).to.equal( 'dist/esnext.js' );
	} );

	it( 'parses author object into string', async () => {
		const author = deepClone( valid );
		author.author = {
			name: 'Tester'
		};

		const parsedMetadata = await packageParser( author );

		expect( parsedMetadata.author ).to.equal( 'Tester' );
	} );
} );

async function parseMetadataAndGetDistInfo( metadata, srcFile = `src${ pathSeparator }index.js` ) {
	const parsedMetadata = await packageParser( metadata );

	return parsedMetadata.dist[ srcFile ];
}

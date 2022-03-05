import { resolve as resolvePath } from 'path';
import valid from './__fixtures__/packageParser/valid.json';
import validExports from './__fixtures__/packageParser/validExports.json';
import packageParser from '../src/packageParser.js';
import { deepClone } from './__helpers__/utils';

const fixturesPath = resolvePath( __dirname, '__fixtures__', 'packageParser' );
const validFixturePath = resolvePath( fixturesPath, 'valid.json' );
const invalidFixturePath = resolvePath( fixturesPath, 'invalid.json' );
const invalidCJSMetdataError = 'Package metadata must contain one of "exports[ \'.\' ].require", "exports.require" or "main" properties or all of them.';
const invalidESMMetdataError = 'Package metadata must contain one of "exports[ \'.\' ].import", "exports.import", "module" or "jsnext:main" properties or all of them.';

describe( 'packageParser', () => {
	it( 'is a function', () => {
		expect( packageParser ).to.be.a( 'function' );
	} );

	it( 'expects string or object', () => {
		expect( () => {
			packageParser();
		} ).to.throw( TypeError, 'Provide string or object.' );

		expect( () => {
			packageParser( 1 );
		} ).to.throw( TypeError, 'Provide string or object.' );
	} );

	it( 'treats string as path to JSON file', () => {
		expect( packageParser( validFixturePath ) ).to.be.an( 'object' );

		expect( () => {
			packageParser( 'non-existent.json' );
		} ).to.throw( ReferenceError, 'File with given path does not exist.' );

		expect( () => {
			packageParser( invalidFixturePath );
		} ).to.throw( SyntaxError, 'Given file is not parsable as a correct JSON.' );
	} );

	it( 'treats object as loaded package.json file', () => {
		expect( packageParser( valid ) ).to.be.an( 'object' );
	} );

	it( 'requires certain properties', () => {
		expect( () => {
			packageParser( {} );
		} ).to.throw( ReferenceError, 'Package metadata must contain "name" property.' );

		expect( () => {
			packageParser( {
				name: 'test'
			} );
		} ).to.throw( ReferenceError, 'Package metadata must contain "version" property.' );

		expect( () => {
			packageParser( {
				name: 'test',
				version: '0.0.0'
			} );
		} ).to.throw( ReferenceError, invalidCJSMetdataError );

		expect( () => {
			packageParser( {
				name: 'test',
				version: '0.0.0',
				main: 'test'
			} );
		} ).to.throw( ReferenceError, invalidESMMetdataError );

		expect( () => {
			packageParser( {
				name: 'test',
				version: '0.0.0',
				main: 'test',
				module: 'test'
			} );
		} ).to.throw( ReferenceError, 'Package metadata must contain "author" property.' );

		expect( () => {
			packageParser( {
				name: 'test',
				version: '0.0.0',
				main: 'test',
				module: 'test',
				author: 'test'
			} );
		} ).to.throw( ReferenceError, 'Package metadata must contain "license" property.' );
	} );

	// #61
	it( 'requires module or jsnext:main if exports does not contain import property', () => {
		expect( () => {
			packageParser( {
				name: 'test',
				version: '0.0.0',
				exports: {
					require: 'dist/whatever.js'
				}
			} );
		} ).to.throw( ReferenceError, invalidESMMetdataError );
	} );

	// #61
	it( 'requires main if exports does not contain require property', () => {
		expect( () => {
			packageParser( {
				name: 'test',
				version: '0.0.0',
				exports: {
					import: 'dist/whatever.js'
				}
			} );
		} ).to.throw( ReferenceError, invalidCJSMetdataError );
	} );

	it( 'returns simplified metadata', () => {
		expect( packageParser( valid ) ).to.deep.equal( {
			name: 'test-package',
			author: 'Comandeer',
			license: 'MIT',
			version: '9.0.1',
			src: 'src/index.js',
			dist: {
				esm: 'dist/es2015.js',
				cjs: 'dist/es5.js'
			}
		} );
	} );

	// #61
	it( 'returns simplified metadata for package with "exports" field', () => {
		expect( packageParser( validExports ) ).to.deep.equal( {
			name: 'test-package',
			author: 'Comandeer',
			license: 'MIT',
			version: '9.0.1',
			src: 'src/index.js',
			dist: {
				esm: 'dist/test-package.mjs',
				cjs: 'dist/test-package.cjs'
			}
		} );
	} );

	// #61
	it( 'prefers exports[ \'.\' ].import over exports.import', () => {
		const distPath = 'dist/subpath.mjs';
		const module = deepClone( validExports );
		module.exports[ '.' ] = {
			import: distPath
		};

		expect( packageParser( module ).dist.esm ).to.equal( distPath );
	} );

	// #61
	it( 'prefers exports[ \'.\' ].require over exports.require', () => {
		const distPath = 'dist/subpath.cjs';
		const module = deepClone( validExports );
		module.exports[ '.' ] = {
			require: distPath
		};

		expect( packageParser( module ).dist.cjs ).to.equal( distPath );
	} );

	// #61
	it( 'prefers exports.import over module', () => {
		const module = deepClone( validExports );
		module.module = 'dist/es2015.js';

		expect( packageParser( module ).dist.esm ).to.equal( 'dist/test-package.mjs' );
	} );

	// #61
	it( 'prefers exports.require over main', () => {
		const module = deepClone( validExports );
		module.main = 'dist/es5.js';

		expect( packageParser( module ).dist.cjs ).to.equal( 'dist/test-package.cjs' );
	} );

	it( 'prefers module over jsnext:main', () => {
		const module = deepClone( valid );
		module[ 'jsnext:main' ] = 'dist/esnext.js';

		expect( packageParser( module ).dist.esm ).to.equal( 'dist/es2015.js' );
	} );

	// #61
	it( 'uses module when exports.import is not available', () => {
		const module = deepClone( validExports );
		module.module = 'dist/module.js';
		delete module.exports.import;

		expect( packageParser( module ).dist.esm ).to.equal( 'dist/module.js' );
	} );

	// #61
	it( 'uses jsnext:main when both exports.import and module are not available', () => {
		const module = deepClone( validExports );
		module[ 'jsnext:main' ] = 'dist/jsnext.js';
		delete module.exports.import;

		expect( packageParser( module ).dist.esm ).to.equal( 'dist/jsnext.js' );
	} );

	// #61
	it( 'uses main when exports.require is not available', () => {
		const module = deepClone( validExports );
		module.main = 'dist/legacy.js';
		delete module.exports.require;

		expect( packageParser( module ).dist.cjs ).to.equal( 'dist/legacy.js' );
	} );

	it( 'uses jsnext:main when module is not available', () => {
		const jsnext = deepClone( valid );
		jsnext[ 'jsnext:main' ] = 'dist/esnext.js';
		delete jsnext.module;

		expect( packageParser( jsnext ).dist.esm ).to.equal( 'dist/esnext.js' );
	} );

	it( 'parses author object into string', () => {
		const author = deepClone( valid );
		author.author = {
			name: 'Tester'
		};

		expect( packageParser( author ).author ).to.equal( 'Tester' );
	} );
} );

import { resolve as resolvePath } from 'path';
import { expect } from 'chai';
import valid from './fixtures/packageParser/valid.json';
import packageParser from '../src/packageParser.js';

const fixturesPath = resolvePath( __dirname, 'fixtures', 'packageParser' );
const validFixturePath = resolvePath( fixturesPath, 'valid.json' );
const invalidFixturePath = resolvePath( fixturesPath, 'invalid.json' );

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
		} ).to.throw( ReferenceError, 'Package metadata must contain "main" property.' );

		expect( () => {
			packageParser( {
				name: 'test',
				version: '0.0.0',
				main: 'test'
			} );
		} ).to.throw( ReferenceError, 'Package metadata must contain either "module" or "jsnext:main" or both properties.' );

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

	it( 'prefers module over jsnext:main', () => {
		const module = Object.assign( {}, valid );
		module[ 'jsnext:main' ] = 'dist/esnext.js';

		expect( packageParser( module ).dist.esm ).to.equal( 'dist/es2015.js' );
	} );

	it( 'uses jsnext:main when module is not available', () => {
		const jsnext = Object.assign( {}, valid );
		jsnext[ 'jsnext:main' ] = 'dist/esnext.js';
		delete jsnext.module;

		expect( packageParser( jsnext ).dist.esm ).to.equal( 'dist/esnext.js' );
	} );

	it( 'parses author object into string', () => {
		const author = Object.assign( {}, valid );
		author.author = {
			name: 'Tester'
		};

		expect( packageParser( author ).author ).to.equal( 'Tester' );
	} );
} );

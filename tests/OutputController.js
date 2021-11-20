import { Console } from 'console';
import consoleControlStrings from 'console-control-strings';
import createDummyStream from './__helpers__/createDummyStream.js';
import OutputController from '../src/OutputController.js';

describe( 'OutputController', () => {
	let sandbox;

	beforeEach( () => {
		sandbox = sinon.createSandbox();
	} );

	afterEach( () => {
		sandbox.restore();
	} );

	it( 'is a class', () => {
		expect( OutputController ).to.be.a( 'function' );
	} );

	describe( '#constructor()', () => {
		it( 'allows passing custom stdout and stderr streams as part of options argument', () => {
			const { stream: dummyStdout, output: stdoutLog } = createDummyStream();
			const { stream: dummyStderr } = createDummyStream();
			const outputController = new OutputController( {
				stdout: dummyStdout,
				stderr: dummyStderr
			} );

			outputController.addLog( 'dummy' );
			outputController.display();

			expect( stdoutLog ).to.deep.equal( [
				'dummy\n'
			] );
		} );

		it( 'creates custom console object', () => {
			const outputController = new OutputController();

			expect( outputController.console ).to.be.an.instanceOf( Console );
			expect( outputController ).not.to.equal( console );
		} );

		it( 'accepts only writable and duplex streams as the first two parameters', () => {
			const invalidArguments = [
				1,
				'a',
				{},
				[],
				{
					write() {}
				},
				null,
				() => {}
			];

			invalidArguments.forEach( ( argument ) => {
				expect( () => {
					new OutputController( {
						stdout: argument
					} );
				} ).to.throw( TypeError, 'Custom stdout must be a valid writable/duplex stream' );

				expect( () => {
					new OutputController( {
						stderr: argument
					} );
				} ).to.throw( TypeError, 'Custom stderr must be a valid writable/duplex stream' );
			} );

			expect( () => {
				const { stream: dummyStdout } = createDummyStream();
				const { stream: dummyStderr } = createDummyStream( {
					type: 'duplex'
				} );

				new OutputController( dummyStdout, dummyStderr );
			} ).not.to.throw( TypeError );
		} );
	} );

	describe( '#showSpinner()', () => {
		let outputController;

		afterEach( async () => {
			outputController.hideSpinner();
		} );

		it( 'shows spinner', async () => {
			const { stream: dummyStderr, output: stderrLog } = createDummyStream();
			outputController = new OutputController( {
				stderr: dummyStderr
			} );

			await outputController.showSpinner();

			// Let's assume that displaying anything means that the spinner was displayed correctly.
			expect( stderrLog ).to.have.lengthOf( 1 );
		} );
	} );

	describe.skip( '#hideSpinner()', () => { // eslint-disable-line mocha/no-skipped-tests
		it( 'emits correct control strings for hiding spinner', async () => {
			const { stream: dummyStderr, output: stderrLog } = createDummyStream();
			const outputController = new OutputController( {
				stderr: dummyStderr
			} );
			const expectedOutput = [
				consoleControlStrings.gotoSOL() + consoleControlStrings.eraseLine() + consoleControlStrings.showCursor()
			];

			await outputController.showSpinner();

			stderrLog.length = 0;

			await outputController.hideSpinner();

			expect( stderrLog ).to.deep.equal( expectedOutput );
		} );
	} );

	describe( '#addLog()', () => {
		it( 'pushes all passed arguments to pending logs array', () => {
			const args = [
				[
					1,
					'hublabubla',
					{}
				],

				[
					2,
					'albubalbuh',
					{}
				]
			];
			const outputController = new OutputController();

			args.forEach( ( arg ) => {
				outputController.addLog( ...arg );
			} );

			expect( outputController.pending ).to.deep.equal( args );
		} );
	} );

	describe( '#addWarning()', () => {
		it( 'creates and pushes a warning to pending logs array', () => {
			const expected = [
				[
					`${ consoleControlStrings.color( [ 'yellow', 'bold' ] ) }⚠️ Warning!⚠️ hublabubla${ consoleControlStrings.color( 'reset' ) }`
				]
			];
			const outputController = new OutputController();

			outputController.addWarning( 'hublabubla' );

			expect( outputController.pending ).to.deep.equal( expected );
		} );

		it( 'uses warning#message property as a warning content', () => {
			const expected = [
				[
					`${ consoleControlStrings.color( [ 'yellow', 'bold' ] ) }⚠️ Warning!⚠️ hublabubla${ consoleControlStrings.color( 'reset' ) }`
				]
			];
			const warning = {
				message: 'hublabubla'
			};
			const outputController = new OutputController();

			outputController.addWarning( warning );

			expect( outputController.pending ).to.deep.equal( expected );
		} );

		it( 'supresses external dependencies warning', () => {
			const warning = {
				code: 'UNRESOLVED_IMPORT'
			};
			const outputController = new OutputController();

			outputController.addWarning( warning );

			expect( outputController.pending ).to.deep.equal( [] );
		} );
	} );

	describe( '#display()', () => {
		it( 'displays all pending logs in order', () => {
			const logs = [
				[ 5, 'hublabubla', { a: 3 } ],
				[ 'whatever', false ],
				[ { b: 123 } ]
			];
			const { stream: dummyStdout } = createDummyStream();
			const outputController = new OutputController( {
				stdout: dummyStdout
			} );
			const spy = sandbox.spy( outputController.console, 'log' );

			outputController.pending = [ ...logs ];

			outputController.display();

			expect( spy ).to.have.been.calledThrice;

			logs.forEach( ( log, i ) => {
				expect( spy.getCall( i ) ).to.have.been.calledWithExactly( ...log );
			} );
		} );
	} );

	describe( '#displayError()', () => {
		it( 'outputs error into stderr', () => {
			const { stream: dummyStderr, output } = createDummyStream();
			const error = new Error( 'whatever' );
			const outputController = new OutputController( {
				stderr: dummyStderr
			} );

			outputController.displayError( error );

			// Just check if there's anything in stderr.
			expect( output ).to.have.lengthOf.above( 0 );
		} );
	} );
} );

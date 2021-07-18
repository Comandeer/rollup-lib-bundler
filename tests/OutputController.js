import { Console } from 'console';
import consoleControlStrings from 'console-control-strings';
import createDummyStream from './helpers/createDummyStream.js';
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
				const { stream: dummyStderr } = createDummyStream( 'duplex' );

				new OutputController( dummyStdout, dummyStderr );
			} ).not.to.throw( TypeError );
		} );
	} );

	describe( '#showGauge()', () => {
		it.skip( 'shows gauge', async () => {  // eslint-disable-line mocha/no-skipped-tests
			const { stream: dummyStdout, output: stdoutLog } = createDummyStream();
			const outputController = new OutputController( {
				stdout: dummyStdout
			} );

			outputController.showGauge();

			// Let's assume that displaying anything means that the gauge was displayed correctly.
			expect( stdoutLog ).to.have.lengthOf( 1 );
		} );
	} );

	describe( '#hideGauge()', () => {
		it.skip( 'emits correct control strings for hiding gauge', async () => {  // eslint-disable-line mocha/no-skipped-tests
			const { stream: dummyStdout, output: stdoutLog } = createDummyStream();
			const outputController = new OutputController( {
				stdout: dummyStdout
			} );
			const expected = consoleControlStrings. gotoSOL() + consoleControlStrings.eraseLine();

			outputController.showGauge();
			outputController.hideGauge();

			expect( stdoutLog.pop() ).to.equal( expected );
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
} );

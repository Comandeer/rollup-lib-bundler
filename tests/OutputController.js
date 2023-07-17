import { Console } from 'node:console';
import consoleControlStrings from 'console-control-strings';
import test from 'ava';
import createDummyStream from './__helpers__/createDummyStream.js';
import testWithSinonSandbox from './__helpers__/macros/testWithSinonSandbox.js';
import OutputController from '../src/OutputController.js';

test( 'OutputController is a class', ( t ) => {
	t.is( typeof OutputController, 'function' );
} );

test( 'OutputController#constructor() allows passing custom stdout and stderr streams as part of options argument', ( t ) => {
	const { stream: dummyStdout, output: stdoutLog } = createDummyStream();
	const { stream: dummyStderr } = createDummyStream();
	const outputController = new OutputController( {
		stdout: dummyStdout,
		stderr: dummyStderr
	} );
	const expectedStdout = [
		'dummy\n'
	];

	outputController.addLog( 'dummy' );
	outputController.display();

	t.deepEqual( stdoutLog, expectedStdout );
} );

test( 'OutputController#constructor() creates custom console object', ( t ) => {
	const outputController = new OutputController();

	t.true( outputController.console instanceof Console );
	t.not( outputController.console, console );
} );

test( 'OutputController#constructor() accepts only writable and duplex streams as the first two parameters', ( t ) => {
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
		t.throws( () => {
			new OutputController( {
				stdout: argument
			} );
		}, {
			instanceOf: TypeError,
			message: 'Custom stdout must be a valid writable/duplex stream'
		} );

		t.throws( () => {
			new OutputController( {
				stderr: argument
			} );
		}, {
			instanceOf: TypeError,
			message: 'Custom stderr must be a valid writable/duplex stream'
		} );
	} );

	t.notThrows( () => {
		const { stream: dummyStdout } = createDummyStream();
		const { stream: dummyStderr } = createDummyStream( {
			type: 'duplex'
		} );

		new OutputController( {
			stdout: dummyStdout,
			stderr: dummyStderr
		} );
	} );
} );

test( 'OutputController#addLog() pushes all passed arguments to pending logs array', ( t ) => {
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

	t.deepEqual( outputController.pendingLogs, args );
} );

test( 'OutputController#addWarning() creates and pushes a warning to pending logs array', ( t ) => {
	const expected = [
		[
			`${ consoleControlStrings.color( [ 'yellow', 'bold' ] ) }⚠️ Warning!⚠️ hublabubla${ consoleControlStrings.color( 'reset' ) }`
		]
	];
	const outputController = new OutputController();

	outputController.addWarning( 'hublabubla' );

	t.deepEqual( outputController.pendingWarnings, expected );
} );

test( 'OutputController#addWarning() uses warning#message property as a warning content', ( t ) => {
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

	t.deepEqual( outputController.pendingWarnings, expected );
} );

test( 'OutputController#addWarning() supresses external dependencies warning', ( t ) => {
	const warning = {
		code: 'UNRESOLVED_IMPORT'
	};
	const outputController = new OutputController();

	outputController.addWarning( warning );

	t.deepEqual( outputController.pendingWarnings, [] );
} );

test( 'OutputController#display() displays all pending logs in order', testWithSinonSandbox, ( t, sandbox ) => {
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

	outputController.pendingLogs = [ ...logs ];

	outputController.display();

	t.true( spy.calledThrice );

	logs.forEach( ( log, i ) => {
		t.true( spy.getCall( i ).calledWithExactly( ...log ) );
	} );
} );

// #208
test( 'OutputController#display() displays all pending warnings in order', testWithSinonSandbox, ( t, sandbox ) => {
	const warnings = [
		[ 5, 'hublabubla', { a: 3 } ],
		[ 'whatever', false ],
		[ { b: 123 } ]
	];
	const { stream: dummyStderr } = createDummyStream();
	const outputController = new OutputController( {
		stderr: dummyStderr
	} );
	const spy = sandbox.spy( outputController.console, 'warn' );

	outputController.pendingWarnings = [ ...warnings ];

	outputController.display();

	t.true( spy.calledThrice );

	warnings.forEach( ( warning, i ) => {
		t.true( spy.getCall( i ).calledWithExactly( ...warning ) );
	} );
} );

test( 'OutputController#display() displays warnings before logs', testWithSinonSandbox, ( t, sandbox ) => {
	const logs = [
		[ 'log1' ],
		[ 'log2' ]
	];
	const warnings = [
		[ 'warning1' ],
		[ 'warning2' ]
	];
	const { stream: dummyStdout } = createDummyStream();
	const outputController = new OutputController( {
		stdout: dummyStdout,
		stderr: dummyStdout
	} );
	const warnSpy = sandbox.spy( outputController.console, 'warn' );
	const logSpy = sandbox.spy( outputController.console, 'log' );

	outputController.pendingLogs = [ ...logs ];
	outputController.pendingWarnings = [ ...warnings ];

	outputController.display();

	t.true( warnSpy.calledTwice );
	t.true( warnSpy.calledBefore( logSpy ) );
	t.true( logSpy.calledTwice );
} );

test( 'OutputController#displayError() outputs error into stderr', ( t ) => {
	const { stream: dummyStderr, output } = createDummyStream();
	const error = new Error( 'whatever' );
	const outputController = new OutputController( {
		stderr: dummyStderr
	} );

	outputController.displayError( error );

	// Just check if there's anything in stderr.
	t.not( output.length, 0 );
} );

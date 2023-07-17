import consoleControlStrings from 'console-control-strings';
import test from 'ava';
import testWithSinonSandbox from './__helpers__/macros/testWithSinonSandbox.js';
import OutputController from '../src/OutputController.js';
import createDummyConsole from './__helpers__/createDummyConsole.js';
import createDummySpinner from './__helpers__/createDummySpinner.js';

test( 'OutputController is a class', ( t ) => {
	t.is( typeof OutputController, 'function' );
} );

test( 'OutputController#constructor() allows passing custom console object', ( t ) => {
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
				console: argument
			} );
		}, {
			instanceOf: TypeError,
			message: 'Custom console must be a valid Console object'
		} );
	} );

	t.notThrows( () => {
		const { console } = createDummyConsole();

		new OutputController( {
			console
		} );
	} );
} );

test( 'OutputController#constructor() allows passing custom spinner object', ( t ) => {
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
				spinner: argument
			} );
		}, {
			instanceOf: TypeError,
			message: 'Custom spinner must be a valid spinner object'
		} );
	} );

	t.notThrows( () => {
		const spinner = createDummySpinner();

		new OutputController( {
			spinner
		} );
	} );
} );

test( 'OutputController.createWarning() creates a warning', ( t ) => {
	const expected = `${ consoleControlStrings.color( [ 'yellow', 'bold' ] ) }⚠️ Warning!⚠️ hublabubla${ consoleControlStrings.color( 'reset' ) }`;
	const actual = OutputController.createWarning( 'hublabubla' );

	t.deepEqual( actual, expected );
} );

test( 'OutputController.createError() creates an error', ( t ) => {
	const expectedBeginning = `${ consoleControlStrings.color( [ 'bold', 'red' ] ) }🚨Error🚨
Error: hublabubla${ consoleControlStrings.color( 'reset' ) }`;
	const actual = OutputController.createError( new Error( 'hublabubla' ) );

	t.true( actual.startsWith( expectedBeginning ) );
} );

test( 'OutputController#addWarning() uses warning#message property as a warning content', ( t ) => {
	const expected = [
		`${ consoleControlStrings.color( [ 'yellow', 'bold' ] ) }⚠️ Warning!⚠️ hublabubla${ consoleControlStrings.color( 'reset' ) }\n`
	];
	const warning = {
		message: 'hublabubla'
	};
	const { stderr, console } = createDummyConsole();
	const outputController = new OutputController( {
		console
	} );

	outputController.addWarning( warning );
	outputController.display();

	t.deepEqual( stderr, expected );
} );

test( 'OutputController#addWarning() supresses external dependencies warning', ( t ) => {
	const warning = {
		code: 'UNRESOLVED_IMPORT',
		message: 'Some message'
	};
	const { stderr, console } = createDummyConsole();
	const outputController = new OutputController( {
		console
	} );

	outputController.addWarning( warning );
	outputController.display();

	t.deepEqual( stderr, [] );
} );

test( 'OutputController#display() displays all pending logs in order', testWithSinonSandbox, ( t, sandbox ) => {
	const logs = [
		[ 5, 'hublabubla', { a: 3 } ],
		[ 'whatever', false ],
		[ { b: 123 } ]
	];
	const { console } = createDummyConsole();
	const outputController = new OutputController( {
		console
	} );
	const spy = sandbox.spy( console, 'log' );

	logs.forEach( ( log ) => {
		outputController.addLog( ...log );
	} );

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
	const { console } = createDummyConsole();
	const outputController = new OutputController( {
		console
	} );
	const spy = sandbox.spy( console, 'warn' );

	warnings.forEach( ( warning ) => {
		outputController.addWarning( ...warning );
	} );

	outputController.display();

	t.true( spy.calledThrice );

	warnings.forEach( ( warning, i ) => {
		const formattedWarning = OutputController.createWarning( ...warning );

		t.true( spy.getCall( i ).calledWithExactly( formattedWarning ) );
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
	const { console } = createDummyConsole();
	const outputController = new OutputController( {
		console
	} );
	const warnSpy = sandbox.spy( console, 'warn' );
	const logSpy = sandbox.spy( console, 'log' );

	logs.forEach( ( log ) => {
		outputController.addLog( ...log );
	} );

	warnings.forEach( ( warning ) => {
		outputController.addWarning( ...warning );
	} );

	outputController.display();

	t.true( warnSpy.calledTwice );
	t.true( warnSpy.calledBefore( logSpy ) );
	t.true( logSpy.calledTwice );
} );

test( 'OutputController#displayError() outputs error into stderr', ( t ) => {
	const { stderr, console } = createDummyConsole();
	const error = new Error( 'whatever' );
	const outputController = new OutputController( {
		console
	} );

	outputController.displayError( error );

	// Just check if there's anything in stderr.
	t.not( stderr.length, 0 );
} );

test( 'OutputController#showSpinner() calls spinner\'s show method', testWithSinonSandbox, ( t, sandbox ) => {
	const spinner = createDummySpinner();
	const outputController = new OutputController( {
		spinner
	} );
	const spy = sandbox.spy( spinner, 'show' );

	outputController.showSpinner();

	t.true( spy.calledOnce );
} );

test( 'OutputController#showSpinner() calls spinner\'s hide method', testWithSinonSandbox, ( t, sandbox ) => {
	const spinner = createDummySpinner();
	const outputController = new OutputController( {
		spinner
	} );
	const spy = sandbox.spy( spinner, 'hide' );

	outputController.hideSpinner();

	t.true( spy.calledOnce );
} );

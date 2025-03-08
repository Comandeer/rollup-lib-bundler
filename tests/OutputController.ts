import chalk from 'chalk';
import test from 'ava';
import { testWithSinonSandbox } from './__helpers__/macros/testWithSinonSandbox.js';
import { OutputController } from '../src/OutputController.js';
import { createDummyConsole } from './__helpers__/createDummyConsole.js';
import { createDummySpinner } from './__helpers__/createDummySpinner.js';

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
			write(): void {}
		},
		null,
		(): void => {}
	];

	invalidArguments.forEach( ( argument ) => {
		t.throws( () => {
			new OutputController( {
				// @ts-expect-error
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
			write(): void {}
		},
		null,
		(): void => {}
	];

	invalidArguments.forEach( ( argument ) => {
		t.throws( () => {
			new OutputController( {
				// @ts-expect-error
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
	const expected = chalk.yellow.bold( '⚠️ Warning!⚠️ hublabubla' );
	const actual = OutputController.createWarning( 'hublabubla' );

	t.deepEqual( actual, expected );
} );

test( 'OutputController.createError() creates an error with a stack', ( t ) => {
	const expected = `${ chalk.red.bold( `🚨Error🚨
Error: hublabubla` ) }
2
3`;
	const error = new Error( 'hublabubla' );

	error.stack = '1\n2\n3';

	const actual = OutputController.createError( error );

	t.is( actual, expected );
} );

test( 'OutputController.createError() creates an error without a stack', ( t ) => {
	const expected = `${ chalk.red.bold( `🚨Error🚨
Error: hublabubla` ) }
`;
	const error = new Error( 'hublabubla' );

	delete error.stack;

	const actual = OutputController.createError( error );

	t.is( actual, expected );
} );

test( 'OutputController#addWarning() uses warning#message property as a warning content', async ( t ) => {
	const expected = [
		chalk.yellow.bold( '⚠️ Warning!⚠️ hublabubla\n' )
	];
	const warning = {
		message: 'hublabubla'
	};
	const { stderr, console } = createDummyConsole();
	const outputController = new OutputController( {
		console
	} );

	outputController.addWarning( warning );
	await outputController.display();

	t.deepEqual( stderr, expected );
} );

test( 'OutputController#addWarning() supresses external dependencies warning', async ( t ) => {
	const warning = {
		code: 'UNRESOLVED_IMPORT',
		message: 'Some message'
	};
	const { stderr, console } = createDummyConsole();
	const outputController = new OutputController( {
		console
	} );

	outputController.addWarning( warning );
	await outputController.display();

	t.deepEqual( stderr, [] );
} );

test( 'OutputController#display() displays all pending logs in order', testWithSinonSandbox, async ( t, sandbox ) => {
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

	await outputController.display();

	t.true( spy.calledThrice );

	logs.forEach( ( log, i ) => {
		t.true( spy.getCall( i ).calledWithExactly( ...log ) );
	} );
} );

// #208
test( 'OutputController#display() displays all pending warnings in order', testWithSinonSandbox, async ( t, sandbox ) => {
	const warnings = [
		'hublabubla',
		'whatever',
		'test'
	];
	const { console } = createDummyConsole();
	const outputController = new OutputController( {
		console
	} );
	const spy = sandbox.spy( console, 'warn' );

	warnings.forEach( ( warning ) => {
		outputController.addWarning( warning );
	} );

	await outputController.display();

	t.true( spy.calledThrice );

	warnings.forEach( ( warning, i ) => {
		const formattedWarning = OutputController.createWarning( warning );

		t.true( spy.getCall( i ).calledWithExactly( formattedWarning ) );
	} );
} );

test( 'OutputController#display() displays warnings before logs', testWithSinonSandbox, async ( t, sandbox ) => {
	const logs = [
		'log1',
		'log2'
	];
	const warnings = [
		'warning1',
		'warning2'
	];
	const { console } = createDummyConsole();
	const outputController = new OutputController( {
		console
	} );
	const warnSpy = sandbox.spy( console, 'warn' );
	const logSpy = sandbox.spy( console, 'log' );

	logs.forEach( ( log ) => {
		outputController.addLog( log );
	} );

	warnings.forEach( ( warning ) => {
		outputController.addWarning( warning );
	} );

	await outputController.display();

	t.true( warnSpy.calledTwice );
	t.true( warnSpy.calledBefore( logSpy ) );
	t.true( logSpy.calledTwice );
} );

test( 'OutputController#displayError() outputs error into stderr', async ( t ) => {
	const { stderr, console } = createDummyConsole();
	const error = new Error( 'whatever' );
	const outputController = new OutputController( {
		console
	} );

	await outputController.displayError( error );

	// Just check if there's anything in stderr.
	t.not( stderr.length, 0 );
} );

test( 'OutputController#showSpinner() calls spinner\'s show method', testWithSinonSandbox, async ( t, sandbox ) => {
	const spinner = createDummySpinner();
	const outputController = new OutputController( {
		spinner
	} );
	const spy = sandbox.spy( spinner, 'show' );

	await outputController.showSpinner();

	t.true( spy.calledOnce );
} );

test( 'OutputController#showSpinner() calls spinner\'s hide method', testWithSinonSandbox, async ( t, sandbox ) => {
	const spinner = createDummySpinner();
	const outputController = new OutputController( {
		spinner
	} );
	const spy = sandbox.spy( spinner, 'hide' );

	await outputController.hideSpinner();

	t.true( spy.calledOnce );
} );

// #309
test( 'OutputController#display() calls #hideSpinner() method', testWithSinonSandbox, async ( t, sandbox ) => {
	const { console } = createDummyConsole();
	const outputController = new OutputController( {
		console
	} );
	const spy = sandbox.spy( outputController, 'hideSpinner' );

	await outputController.display();

	t.true( spy.calledOnce );
} );

// #309
test( 'OutputController#displayError() calls #hideSpinner() method', testWithSinonSandbox, async ( t, sandbox ) => {
	const { console } = createDummyConsole();
	const outputController = new OutputController( {
		console
	} );
	const spy = sandbox.spy( outputController, 'hideSpinner' );

	await outputController.displayError( new Error() );

	t.true( spy.calledOnce );
} );

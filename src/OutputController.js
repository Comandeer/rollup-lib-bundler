import { Console } from 'node:console';
import { stdout, stderr } from 'node:process';
import Spinner from '@comandeer/cli-spinner';
import consoleControlStrings from 'console-control-strings';

export default class OutputController {
	#console;
	#spinner;
	#pendingLogs;
	#pendingWarnings;

	static createWarning( warning ) {
		if ( warning && typeof warning === 'object' && warning.message ) {
			warning = warning.message;
		}

		return `${ consoleControlStrings.color( [ 'yellow', 'bold' ] ) }⚠️ Warning!⚠️ ${ warning }${ consoleControlStrings.color( 'reset' ) }`;
	}

	static createError( { name, message, stack } ) {
		const stackParts = stack.split( '\n' );

		stackParts.shift();

		const newStack = stackParts.join( '\n' );

		return `${ consoleControlStrings.color( [ 'bold', 'red' ] ) }🚨Error🚨
${ name }: ${ message }${ consoleControlStrings.color( 'reset' ) }
${ newStack }`;
	}

	constructor( {
		console = new Console( {
			stdout,
			stderr
		} ),
		spinner = new Spinner( {
			label: 'Working…',
			stdout: stderr
		} )
	} = {} ) {
		if ( !isValidConsole( console ) ) {
			throw new TypeError( 'Custom console must be a valid Console object' );
		}

		if ( !isValidSpinner( spinner ) ) {
			throw new TypeError( 'Custom spinner must be a valid spinner object' );
		}

		this.#console = console;
		this.#spinner = spinner;
		this.#pendingLogs = [];
		this.#pendingWarnings = [];
	}

	async showSpinner() {
		return this.#spinner.show();
	}

	async hideSpinner() {
		return this.#spinner.hide();
	}

	addLog( ...args ) {
		this.#pendingLogs.push( args );
	}

	addWarning( warningMessage ) {
		if ( isExternalDepWarning( warningMessage ) ) {
			return;
		}

		const warning = OutputController.createWarning( warningMessage );

		this.#pendingWarnings.push( [ warning ] );
	}

	display() {
		this.#pendingWarnings.forEach( ( warning ) => {
			this.#console.warn( ...warning );
		} );

		this.#pendingLogs.forEach( ( log ) => {
			this.#console.log( ...log );
		} );
	}

	displayError( error ) {
		const errorLog = OutputController.createError( error );

		this.#console.error( errorLog );
	}
}

// Duck typing as checking against the Console object does not work correctly.
function isValidConsole( value ) {
	return value && typeof value.log === 'function' && typeof value.warn === 'function' &&
		typeof value.error === 'function';
}

function isValidSpinner( value ) {
	return value && typeof value.show === 'function' && typeof value.hide === 'function';
}

function isExternalDepWarning( log ) {
	return log && typeof log === 'object' && log.code === 'UNRESOLVED_IMPORT';
}

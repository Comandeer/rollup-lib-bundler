import { Console } from 'node:console';
import { Writable as WritableStream } from 'node:stream';
import { Duplex as DuplexStream } from 'node:stream';
import Spinner from '@comandeer/cli-spinner';
import consoleControlStrings from 'console-control-strings';

const stdoutSymbol = Symbol( 'stdout' );
const stderrSymbol = Symbol( 'stderr' );
const spinnerSymbol = Symbol( 'spinner' );

class OutputController {
	constructor( {
		stdout = process.stdout,
		stderr = process.stderr
	} = {} ) {
		if ( !isValidStream( stdout ) ) {
			throw new TypeError( 'Custom stdout must be a valid writable/duplex stream' );
		}

		if ( !isValidStream( stderr ) ) {
			throw new TypeError( 'Custom stderr must be a valid writable/duplex stream' );
		}

		this[ stdoutSymbol ] = stdout;
		this[ stderrSymbol ] = stderr;
		this.console = new Console( {
			stdout,
			stderr
		} );
		this[ spinnerSymbol ] = new Spinner( {
			label: 'Working…',
			stdout: stderr
		} );
		this.pendingLogs = [];
		this.pendingWarnings = [];
	}

	/* istanbul ignore next */
	async showSpinner() {
		return this[ spinnerSymbol ].show();
	}

	/* istanbul ignore next */
	async hideSpinner() {
		return this[ spinnerSymbol ].hide();
	}

	addLog( ...args ) {
		this.pendingLogs.push( args );
	}

	addWarning( warningMessage ) {
		if ( isExternalDepWarning( warningMessage ) ) {
			return;
		}

		const warning = createWarning( warningMessage );

		this.pendingWarnings.push( [ warning ] );
	}

	display() {
		this.pendingWarnings.forEach( ( warning ) => {
			this.console.warn( ...warning );
		} );

		this.pendingLogs.forEach( ( log ) => {
			this.console.log( ...log );
		} );
	}

	displayError( error ) {
		const errorLog = createError( error );

		this.console.error( errorLog );
	}
}

function isValidStream( value ) {
	return value instanceof WritableStream || value instanceof DuplexStream;
}

function isExternalDepWarning( log ) {
	return log && typeof log === 'object' && log.code === 'UNRESOLVED_IMPORT';
}

function createWarning( warning ) {
	if ( warning && typeof warning === 'object' && warning.message ) {
		warning = warning.message;
	}

	return `${ consoleControlStrings.color( [ 'yellow', 'bold' ] ) }⚠️ Warning!⚠️ ${ warning }${ consoleControlStrings.color( 'reset' ) }`;
}

function createError( { name, message, stack } ) {
	const stackParts = stack.split( '\n' );

	stackParts.shift();

	const newStack = stackParts.join( '\n' );

	return `${ consoleControlStrings.color( [ 'bold', 'red' ] ) }🚨Error🚨
${ name }: ${ message }${ consoleControlStrings.color( 'reset' ) }
${ newStack }`;
}

export default OutputController;

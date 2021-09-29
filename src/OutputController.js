import { Console } from 'console';
import { Writable as WritableStream } from 'stream';
import { Duplex as DuplexStream } from 'stream';
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
			label: 'Working…'
		} );
		this.pending = [];
	}

	/* istanbul ignore next */
	showSpinner() {
		this[ spinnerSymbol ].show();
	}

	/* istanbul ignore next */
	hideSpinner() {
		this[ spinnerSymbol ].hide();
	}

	addLog( ...args ) {
		this.pending.push( args );
	}

	addWarning( log ) {
		if ( isExternalDepWarning( log ) ) {
			return;
		}

		const warning = createWarning( log );

		this.pending.push( [ warning ] );
	}

	display() {
		this.pending.forEach( ( log ) => {
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

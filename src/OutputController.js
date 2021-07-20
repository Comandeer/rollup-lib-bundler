import { Console } from 'console';
import { Writable as WritableStream } from 'stream';
import { Duplex as DuplexStream } from 'stream';
import Gauge from 'gauge';
import consoleControlStrings from 'console-control-strings';

const stdoutSymbol = Symbol( 'stdout' );
const stderrSymbol = Symbol( 'stderr' );
const gaugeSymbol = Symbol( 'gauge' );
const gaugeTimeoutSymbol = Symbol( 'gaugeTimeout' );

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
		this[ gaugeSymbol ] = new Gauge( stdout, {
			enabled: true,
			template: [
				{
					type: 'activityIndicator',
					kerning: 1,
					length: 1
				},

				{
					type: 'section',
					kerning: 1,
					default: 'Working…'
				}
			]
		} );
		this[ gaugeTimeoutSymbol ] = null;
		this.pending = [];
	}

	showGauge() {
		const pulse = () => {
			this[ gaugeSymbol ].pulse();
			this[ gaugeTimeoutSymbol ] = setTimeout( pulse, 50 );
		};

		this[ gaugeSymbol ].show( 'Working…' );
		pulse();
	}

	hideGauge() {
		clearTimeout( this[ gaugeTimeoutSymbol ] );
		this[ gaugeSymbol ].hide();

		this[ gaugeTimeoutSymbol ] = null;
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

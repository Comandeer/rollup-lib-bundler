import { Console } from 'node:console';
import { stdout, stderr } from 'node:process';
import Spinner from '@comandeer/cli-spinner';
import consoleControlStrings from 'console-control-strings';

export type OnWarnCallback = ( warning: string | Warning ) => void;

interface SpinnerLike {
	show: () => Promise<void>;
	hide: () => Promise<void>;
}

interface ConsoleLike {
	log: ( ...args: Array<unknown> ) => void;
	warn: ( ...args: Array<unknown> ) => void;
	error: ( ...args: Array<unknown> ) => void;
}

interface StackableError extends Error {
	stack?: string;
}

interface Warning {
	code?: string;
	message?: string;
}

const boldYellow: string = consoleControlStrings.color( [ 'yellow', 'bold' ] );
const boldRed: string = consoleControlStrings.color( [ 'bold', 'red' ] );
const colorReset: string = consoleControlStrings.color( 'reset' );

export default class OutputController {
	#console: ConsoleLike;
	#spinner: SpinnerLike;
	#pendingLogs: Array<Array<unknown>>;
	#pendingWarnings: Array<Array<unknown>>;

	static createWarning( warning: string | Warning ): string {
		if ( typeof warning === 'object' && warning.message !== undefined ) {
			warning = warning.message;
		}

		return `${ boldYellow }⚠️ Warning!⚠️ ${ warning as string }${ colorReset }`;
	}

	static createError( { name, message, stack }: StackableError ): string {
		const stackParts = stack?.split( '\n' ) ?? [];

		stackParts.shift();

		const newStack = stackParts.join( '\n' );

		return `${ boldRed }🚨Error🚨
${ name }: ${ message }${ colorReset }
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

	async showSpinner(): Promise<void> {
		return this.#spinner.show();
	}

	async hideSpinner(): Promise<void> {
		return this.#spinner.hide();
	}

	addLog( ...args: Array<unknown> ): void {
		this.#pendingLogs.push( args );
	}

	addWarning( warningMessage: string | Warning ): void {
		if ( isExternalDepWarning( warningMessage ) ) {
			return;
		}

		const warning = OutputController.createWarning( warningMessage );

		this.#pendingWarnings.push( [ warning ] );
	}

	display(): void {
		this.#pendingWarnings.forEach( ( warning ) => {
			this.#console.warn( ...warning );
		} );

		this.#pendingLogs.forEach( ( log ) => {
			this.#console.log( ...log );
		} );
	}

	displayError( error: StackableError ): void {
		const errorLog = OutputController.createError( error );

		this.#console.error( errorLog );
	}
}

// Duck typing as checking against the Console object does not work correctly.
function isValidConsole( value: unknown ): value is ConsoleLike {
	return value !== null && typeof value === 'object' && 'log' in value && 'warn' in value &&
		'error' in value;
}

function isValidSpinner( value: unknown ): value is SpinnerLike {
	return value !== null && typeof value === 'object' && 'show' in value && 'hide' in value;
}

function isExternalDepWarning( log: string | Warning ): boolean {
	return typeof log === 'object' && log.code === 'UNRESOLVED_IMPORT';
}

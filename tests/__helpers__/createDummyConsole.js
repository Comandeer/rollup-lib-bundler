import { Console } from 'node:console';
import createDummyStream from './createDummyStream.js';

/**
 * @typedef {Object} DummyConsole
 * @property {Array<unknown>} stdout
 * @property {Array<unknown>} stderr
 * @property {typeof console} console
 */

/**
 * @returns {DummyConsole}
 */
export default function createDummyConsole() {
	const stdout = createDummyStream();
	const stderr = createDummyStream();
	const console = new Console( {
		stdout: stdout.stream,
		stderr: stderr.stream
	} );

	return {
		stdout: stdout.output,
		stderr: stderr.output,
		console
	};
}

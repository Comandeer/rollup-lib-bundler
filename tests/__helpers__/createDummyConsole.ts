import { Console } from 'node:console';
import { createDummyStream } from './createDummyStream.js';

interface DummyConsole {
	stdout: Array<unknown>;
	stderr: Array<unknown>;
	console: typeof console;
}

export function createDummyConsole(): DummyConsole {
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

import { Duplex as DuplexStream, Writable as WritableStream } from 'node:stream';

interface CreateDummyStreamOptions {
	type?: 'writable' | 'duplex';
	isTTY?: boolean;
}

interface DummyStream {
	stream: WritableStream | DuplexStream;
	output: Array<string>;
}

type ttyStream = ( WritableStream | DuplexStream ) & {
	isTTY?: boolean;
};

export function createDummyStream( {
	type = 'writable',
	isTTY = true
}: CreateDummyStreamOptions = {} ): DummyStream {
	const output: Array<string> = [];
	const StreamConstructor = type === 'writable' ? WritableStream : DuplexStream;
	const stream: ttyStream = new StreamConstructor( {
		write( chunk: unknown, encoding, callback ): void {
			output.push( String( chunk ) );

			callback();

			return;
		}
	} );

	stream.isTTY = isTTY;

	return {
		stream,
		output
	};
}

import { Duplex as DuplexStream, Writable as WritableStream } from 'node:stream';

/**
 * @typedef {Object} CreateDummyStreamOptions
 * @property {'writable' | 'duplex'} [type='writable'] Type of the stream.
 * @property {boolean} [isTTY=true] Whether the stream is a TTY.
 */

/**
 * @typedef {Object} DummyStream
 * @property {WritableStream | DuplexStream} stream
 * @property {Array<string>} output
 */

/**
 *
 * @param {CreateDummyStreamOptions} options
 * @returns {DummyStream}
 */
export default function createDummyStream( {
	type = 'writable',
	isTTY = true
} = {} ) {
	const output = [];
	const StreamConstructor = type === 'writable' ? WritableStream : DuplexStream;
	const stream = new StreamConstructor( {
		write( chunk ) {
			output.push( chunk.toString() );

			return true;
		}
	} );

	stream.isTTY = isTTY;

	return {
		stream,
		output
	};
}

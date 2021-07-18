import { Duplex as DuplexStream } from 'stream';
import { Writable as WritableStream } from 'stream';

function createDummyStream( type = 'writable' ) {
	const output = [];
	const StreamConstructor = type === 'writable' ? WritableStream : DuplexStream;

	return {
		stream: new StreamConstructor( {
			write( chunk ) {
				output.push( chunk.toString() );
			}
		} ),
		output
	};
}

export default createDummyStream;

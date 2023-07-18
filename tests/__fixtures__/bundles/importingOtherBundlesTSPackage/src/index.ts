import Chunk from './chunk.js';
import fn from './fn.js';

function main(): void {
	const chunk = new Chunk();

	console.log( fn() );
	console.log( chunk );
}

export { main };
export { Chunk };
export * from './subdir/submodule.js';

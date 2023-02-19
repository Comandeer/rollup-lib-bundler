import Chunk from '../chunk.js';

class Submodule {
	#chunk;

	constructor() {
		this.#chunk = new Chunk();
	}

	render() {
		this.#chunk.render();
	}
}

export default Submodule;

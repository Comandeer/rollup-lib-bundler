import Submodule from './subdir/submodule.ts'

class Chunk {
	#submodule;

	constructor() {
		this.#submodule = new Submodule();
	}

	render() {
		const div = this.#submodule.createvDOMNode();

		console.log( div );
	}
}

export default Chunk;

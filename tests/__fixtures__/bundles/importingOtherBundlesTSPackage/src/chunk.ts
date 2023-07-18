import createDiv from './createDiv.js';

class Chunk {
	constructor() {
	}

	render() {
		const div = createDiv();

		console.log( div );
	}
}

export default Chunk;

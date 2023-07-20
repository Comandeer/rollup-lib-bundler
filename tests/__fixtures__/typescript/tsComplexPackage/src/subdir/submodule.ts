import add from './add.js';

class Submodule {
	private id: number;

	constructor(id: number) {
		this.id = id;
	}

	test(): number {
		return add( 1, 1 );
	}
}

export default Submodule;

import Submodule from './subdir/submodule.js';

function createDiv() {
	const submodule = new Submodule();

	return submodule.createvDOMNode();
}

export default createDiv;

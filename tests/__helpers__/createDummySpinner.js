/**
 * @typedef {Object} DummySpinner
 * @property {() => void} show
 * @property {() => void} hide
 */

/**
 * @returns {DummySpinner}
 */
export default function createDummySpinner() {
	return {
		show() {},
		hide() {}
	};
}

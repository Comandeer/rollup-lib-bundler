import test from 'ava';
import sinon from 'sinon';

export default test.macro( ( t, callback ) => {
	const sandbox = sinon.createSandbox();

	t.teardown( sandbox.restore );

	return callback( t, sandbox );
} );

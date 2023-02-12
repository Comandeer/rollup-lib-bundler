import test from 'ava';
import sinon from 'sinon';

const testWithSinonSandbox = test.macro( ( t, callback ) => {
	const sandbox = sinon.createSandbox();

	t.teardown( sandbox.restore );

	return callback( t, sandbox );
} );

export default testWithSinonSandbox;

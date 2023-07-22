import test, { ExecutionContext } from 'ava';
import sinon, { SinonSandbox } from 'sinon';

type SinonTestCallback = ( t: ExecutionContext, sandbox: SinonSandbox ) => void | Promise<void>;

export default test.macro( ( t, callback: SinonTestCallback ) => {
	const sandbox = sinon.createSandbox();

	t.teardown( sandbox.restore );

	return callback( t, sandbox );
} );

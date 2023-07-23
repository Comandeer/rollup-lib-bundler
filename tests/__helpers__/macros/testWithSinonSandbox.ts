import test, { ExecutionContext } from 'ava';
import sinon, { SinonSandbox } from 'sinon';

type SinonTestCallback = ( t: ExecutionContext, sandbox: SinonSandbox ) => void | Promise<void>;

export default test.macro( ( t, callback: SinonTestCallback ) => {
	const sandbox = sinon.createSandbox();

	// eslint-disable-next-line @typescript-eslint/unbound-method
	t.teardown( sandbox.restore );

	return callback( t, sandbox );
} );

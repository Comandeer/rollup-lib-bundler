import test, { type ExecutionContext } from 'ava';
import sinon, { type SinonSandbox } from 'sinon';

type SinonTestCallback = ( t: ExecutionContext, sandbox: SinonSandbox ) => void | Promise<void>;

export const testWithSinonSandbox = test.macro( ( t, callback: SinonTestCallback ) => {
	const sandbox = sinon.createSandbox();

	// eslint-disable-next-line @typescript-eslint/unbound-method
	t.teardown( sandbox.restore );

	return callback( t, sandbox );
} );

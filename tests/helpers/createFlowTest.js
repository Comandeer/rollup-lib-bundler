import { resolve as resolvePath } from 'path';

const { stub } = sinon;

/**
 * Create test checking transormations flow.
 *
 * @param {Object} options Test's options.
 * @param {Object} options.bundlerConfig Bundler's config;
 * @param {Object} options.plugins Plugins. Key is a plugin's name, value – plugin's export.
 * @returns {Function} Test function.
 */
function createFlowTest( {
	bundlerConfig =  {},
	plugins = {}
} = {} ) {
	return async () => {
		const pluginsNames = Object.keys( plugins );
		const pluginsToStubs = pluginsNames.map( ( plugin ) => {
			const pluginStub = stub().returns( {
				name: plugin
			} );

			return [
				plugin,
				pluginStub
			];
		} );
		const stubs = new Map( pluginsToStubs );
		const rollupStub = stub().returns( {
			write() {},
			close() {}
		} );
		const proxyquireConfig = Object.entries( plugins ).reduce( ( config, [ plugin, exportName ] ) => {
			const stub = stubs.get( plugin );

			return Object.assign( config, {
				[ plugin ]: exportName === 'default' ? stub : {
					[ exportName ]: stub
				}
			} );
		}, {
			rollup: {
				rollup: rollupStub
			}
		} );

		const bundlerPath = resolvePath( __dirname, '..', '..', 'src', 'bundler.js' );
		const { default: proxiedBundler } = proxyquire( bundlerPath, proxyquireConfig );

		await proxiedBundler( {
			config: bundlerConfig
		} );

		pluginsNames.forEach( ( plugin ) => {
			const stub = stubs.get( plugin );

			expect( stub, plugin ).to.have.been.calledOnce;
		} );

		checkPlugins( rollupStub.firstCall.args[ 0 ], pluginsNames );
	};
}

function checkPlugins( { plugins }, expectedPlugins ) {
	expect( plugins ).to.be.an( 'array' );
	expect( plugins ).to.have.lengthOf( expectedPlugins.length );

	expectedPlugins.forEach( ( expectedPlugin, i ) => {
		expect( plugins[ i ].name ).to.equal( expectedPlugin );
	} );
}

export default createFlowTest;

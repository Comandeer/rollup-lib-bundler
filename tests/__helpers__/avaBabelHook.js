const babelRegister = require( '@babel/register' );
const { default: preset } = require( '@babel/preset-env' );

babelRegister( {
	cache: false,
	caller: {
		name: 'ava-runner',
		supportsStaticESM: false,
		supportsDynamicImport: true
	},
	babelrc: false,
	presets: [
		[
			preset,
			{
				targets: {
					node: '16.12.0'
				}
			}
		]
	]
} );

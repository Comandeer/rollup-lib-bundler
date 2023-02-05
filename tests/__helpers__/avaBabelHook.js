const babelRegister = require( '@babel/register' );
const preset = require( '@babel/preset-env' );

babelRegister( {
	cache: false,
	caller: {
		name: 'mlt',
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

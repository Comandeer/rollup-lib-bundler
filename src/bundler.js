import { rollup } from 'rollup';
import convertCJS from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import json from '@rollup/plugin-json';
import babel from '@rollup/plugin-babel';
import preset from '@babel/preset-env';
import consoleControlStrings from 'console-control-strings';
import generateBanner from './generateBanner.js';
import { node as nodeTarget } from './targets.js';
import OutputController from './OutputController.js';

async function bundler( metadata ) {
	const outputController = new OutputController();
	const inputConfig = getRollupInputConfig( metadata, outputController );
	const outputConfigCJS = getRollupOutputConfig( metadata, 'cjs' );
	const otuputConfigESM = getRollupOutputConfig( metadata, 'esm' );
	let bundle;

	try {
		outputController.showGauge();

		bundle = await rollup( inputConfig );

		await Promise.all( [
			bundle.write( outputConfigCJS ),
			bundle.write( otuputConfigESM )
		] );

		outputController.addLog( `${ consoleControlStrings.color( [ 'bold', 'green' ] ) }Bundling complete!${ consoleControlStrings.color( 'reset' ) }` );
	} catch ( error ) {
		outputController.displayError( error );
		outputController.addLog( `${ consoleControlStrings.color( [ 'bold', 'red' ] ) }Bundling failed!${ consoleControlStrings.color( 'reset' ) }` );
	} finally {
		outputController.hideGauge();
		outputController.display();

		if ( bundle ) {
			return bundle.close(); // eslint-disable-line no-unsafe-finally
		}
	}
}

function getRollupInputConfig( metadata, outputController ) {
	const plugins = [
		convertCJS(),

		json(),

		babel( {
			babelrc: false,
			babelHelpers: 'bundled',
			presets: [
				[
					preset,
					{
						targets: {
							node: nodeTarget
						}
					}
				]
			]
		} ),

		terser()
	];

	return {
		input: metadata.src,
		/* istanbul ignore next */
		onwarn( warning ) {
			outputController.addWarning( warning );
		},
		plugins
	};
}

function getRollupOutputConfig( metadata, format = 'esm' ) {
	const banner = generateBanner( metadata );

	return {
		banner,
		sourcemap: true,
		format,
		file: metadata.dist[ format ],
		exports: 'auto'
	};
}

export default bundler;

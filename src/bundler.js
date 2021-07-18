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

	outputController.showGauge();

	const bundle = await rollup( inputConfig );

	await Promise.all( [
		bundle.write( outputConfigCJS ),
		bundle.write( otuputConfigESM )
	] );

	outputController.hideGauge();
	outputController.addLog( `${ consoleControlStrings.color( [ 'bold', 'green' ] ) }Bundling complete!${ consoleControlStrings.color( 'reset' ) }` );
	outputController.display();

	return bundle.close();
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
			outputController.addLog( warning );
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

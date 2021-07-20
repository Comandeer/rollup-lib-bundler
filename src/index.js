import consoleControlStrings from 'console-control-strings';
import OutputController from './OutputController.js';
import packageParser from './packageParser.js';
import bundler from './bundler.js';

async function rlb() {
	const outputController = new OutputController();

	try {
		outputController.showGauge();

		const bundlerConfig = packageParser( 'package.json' );

		await bundler( {
			onWarn( warning ) {
				outputController.addWarning( warning );
			},
			config: bundlerConfig
		} );

		outputController.addLog( `${ consoleControlStrings.color( [ 'bold', 'green' ] ) }Bundling complete!${ consoleControlStrings.color( 'reset' ) }` );
	} catch ( error ) {
		outputController.displayError( error );
		outputController.addLog( `${ consoleControlStrings.color( [ 'bold', 'red' ] ) }Bundling failed!${ consoleControlStrings.color( 'reset' ) }` );
	} finally {
		outputController.hideGauge();
		outputController.display();
	}
}

export default rlb;

/* istanbul ignore file */
import { resolve as resolvePath } from 'path';
import rimraf from 'rimraf';
import consoleControlStrings from 'console-control-strings';
import OutputController from './OutputController.js';
import packageParser from './packageParser.js';
import bundler from './bundler.js';

async function rlb() {
	const outputController = new OutputController();

	try {
		await outputController.showSpinner();

		const packageDirectory = process.cwd();
		const distPath = resolvePath( packageDirectory, 'dist' );

		await rimrafPromise( distPath );

		const packageInfo = await packageParser( packageDirectory );

		await bundler( {
			onWarn( warning ) {
				outputController.addWarning( warning );
			},
			packageInfo
		} );

		outputController.addLog( `${ consoleControlStrings.color( [ 'bold', 'green' ] ) }Bundling complete!${ consoleControlStrings.color( 'reset' ) }` );
	} catch ( error ) {
		outputController.displayError( error );
		outputController.addLog( `${ consoleControlStrings.color( [ 'bold', 'red' ] ) }Bundling failed!${ consoleControlStrings.color( 'reset' ) }` );
	} finally {
		await outputController.hideSpinner();
		outputController.display();
	}
}

function rimrafPromise( path ) {
	return new Promise( ( resolve, reject ) => {
		rimraf( path, ( error ) => {
			if ( error ) {
				return reject( error );
			}

			resolve();
		} );
	} );
}

export default rlb;

import { rimraf } from 'rimraf';
import consoleControlStrings from 'console-control-strings';
import bundler from './bundler.js';
import OutputController from './OutputController.js';
import packageParser from './packageParser.js';
import getDistDirPaths from './utils/getDistDirPaths.js';

export default async function rlb() {
	const outputController = new OutputController();

	try {
		await outputController.showSpinner();

		const packageDirectory = process.cwd();
		const packageInfo = await packageParser( packageDirectory );
		const distPaths = getDistDirPaths( packageInfo ).filter( ( distDir ) => {
			return distDir !== packageInfo.project;
		} );

		await rimraf( distPaths );

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

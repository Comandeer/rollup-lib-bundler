import { rimraf } from 'rimraf';
import consoleControlStrings from 'console-control-strings';
import bundler from './bundler.js';
import OutputController from './OutputController.js';
import packageParser from './packageParser.js';
import getDistDirPaths from './utils/getDistDirPaths.js';
import { RollupWarning } from 'rollup';

const boldGreen: string = consoleControlStrings.color( [ 'bold', 'green' ] );
const boldRed: string = consoleControlStrings.color( [ 'bold', 'red' ] );
const colorReset: string = consoleControlStrings.color( 'reset' );

export default async function rlb(): Promise<void> {
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
			onWarn( warning: RollupWarning ): void {
				outputController.addWarning( warning );
			},
			packageInfo
		} );

		outputController.addLog( `${ boldGreen }Bundling complete!${ colorReset }` );
	} catch ( error ) {
		outputController.displayError( error );
		outputController.addLog( `${ boldRed }Bundling failed!${ colorReset }` );
	} finally {
		await outputController.hideSpinner();
		outputController.display();
	}
}

import { rimraf } from 'rimraf';
import chalk from 'chalk';
import bundler from './bundler.js';
import OutputController from './OutputController.js';
import packageParser from './packageParser.js';
import getDistDirPaths from './utils/getDistDirPaths.js';
import { RollupLog } from 'rollup';

export default async function rlb(): Promise<void> {
	const outputController = new OutputController();

	try {
		await outputController.showSpinner();

		const packageDirectory = process.cwd();
		const packageMetadata = await packageParser( packageDirectory );
		const distPaths = getDistDirPaths( packageMetadata ).filter( ( distDir ) => {
			return distDir !== packageMetadata.project;
		} );

		await rimraf( distPaths );

		await bundler( {
			onWarn( warning: RollupLog ): void {
				outputController.addWarning( warning );
			},
			packageMetadata
		} );

		outputController.addLog( chalk.green.bold( 'Bundling complete!' ) );
	} catch ( error ) {
		await outputController.displayError( error );
		outputController.addLog( chalk.red.bold( 'Bundling failed!' ) );
	} finally {
		await outputController.display();
	}
}

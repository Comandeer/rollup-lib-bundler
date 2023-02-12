import { rimraf } from 'rimraf';

let globby;

async function removeArtifacts( fixturePath ) {
	if ( !globby ) {
		const globbyModule = await import( 'globby' );
		// eslint-disable-next-line require-atomic-updates
		globby = globbyModule.globby;
	}

	const distPaths = await globby( [
		'**/*Package/dist'
	], {
		cwd: fixturePath,
		onlyDirectories: true,
		absolute: true
	} );

	return rimraf( distPaths );
}

export default removeArtifacts;

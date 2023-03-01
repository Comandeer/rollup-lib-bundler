import { globby } from 'globby';
import { rimraf } from 'rimraf';

async function removeArtifacts( fixturePath ) {
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

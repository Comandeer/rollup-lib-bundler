import { globby } from 'globby';
import { rimraf } from 'rimraf';

export default async function removeArtifacts( fixturePath: string ): Promise<boolean> {
	const distPaths = await globby( [
		'**/*Package/dist'
	], {
		cwd: fixturePath,
		onlyDirectories: true,
		absolute: true
	} );

	return rimraf( distPaths );
}

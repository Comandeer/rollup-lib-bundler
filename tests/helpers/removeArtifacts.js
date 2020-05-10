import { resolve as resolvePath } from 'path';
import { sync as rimraf } from 'rimraf';

function removeArtifacts( fixturesPath ) {
	const distPath = resolvePath( fixturesPath, '*Package', 'dist' );

	rimraf( distPath );
}

export default removeArtifacts;

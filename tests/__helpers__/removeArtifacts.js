import { resolve as resolvePath } from 'path';
import { rimrafSync as rimraf } from 'rimraf';

function removeArtifacts( fixturesPath ) {
	const distPath = resolvePath( fixturesPath, '*Package', 'dist' );

	rimraf( distPath );
}

export default removeArtifacts;

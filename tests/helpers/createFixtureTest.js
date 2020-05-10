import { checkFiles } from './bundleChecks.js';

function createFixtureTest( {
	path = process.cwd(),
	expected = [],
	cmd = async () => {},
	cwd,
	additionalCodeChecks
} = {} ) {
	return async () => {
		if ( cwd ) {
			process.chdir( cwd );
		}

		await cmd();

		checkFiles( path, expected, { additionalCodeChecks } );
	};
}

export default createFixtureTest;

import { checkFiles } from './bundleChecks.js';

function createFixtureTest( {
	path = process.cwd(),
	expected = [],
	cmd = async () => {},
	performFileCheck = true,
	cmdResultCheck = async () => {},
	additionalCodeChecks
} = {} ) {
	return async () => {
		const cmdResult = await cmd();

		await cmdResultCheck( cmdResult );

		if ( performFileCheck ) {
			await checkFiles( path, expected, { additionalCodeChecks } );
		}
	};
}

export default createFixtureTest;

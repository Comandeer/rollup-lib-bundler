import { checkDistFiles } from './bundleChecks.js';

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
			await checkDistFiles( path, expected, { additionalCodeChecks } );
		}
	};
}

export default createFixtureTest;

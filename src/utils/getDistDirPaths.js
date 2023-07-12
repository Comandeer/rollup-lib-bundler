import { dirname } from 'pathe';
import { resolve as resolvePath } from 'pathe';

function getDistDirPaths( { project, dist } ) {
	const distDirPaths = new Set();
	const distFilePaths = Object.values( dist );

	distFilePaths.forEach( ( { esm, cjs, types } ) => {
		const esmFilePath = resolvePath( project, esm );
		const esmDistDirPath = dirname( esmFilePath );

		distDirPaths.add( esmDistDirPath );

		if ( cjs ) {
			const cjsFilePath = resolvePath( project, cjs );
			const cjsDistDirPath = dirname( cjsFilePath );

			distDirPaths.add( cjsDistDirPath );
		}

		if ( types ) {
			const typesFilePath = resolvePath( project, types );
			const typesDistDirPath = dirname( typesFilePath );

			distDirPaths.add( typesDistDirPath );
		}
	} );

	return [ ...distDirPaths ];
}

export default getDistDirPaths;

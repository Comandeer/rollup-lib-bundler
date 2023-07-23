import { dirname, resolve as resolvePath } from 'pathe';
import { PackageMetadata } from '../packageParser.js';

export default function getDistDirPaths( { project, dist }: PackageMetadata ): Array<string> {
	const distDirPaths = new Set<string>();
	const distFilePaths = Object.values( dist );

	distFilePaths.forEach( ( { esm, types } ) => {
		const esmFilePath = resolvePath( project, esm );
		const esmDistDirPath = dirname( esmFilePath );

		distDirPaths.add( esmDistDirPath );

		if ( types !== undefined ) {
			const typesFilePath = resolvePath( project, types );
			const typesDistDirPath = dirname( typesFilePath );

			distDirPaths.add( typesDistDirPath );
		}
	} );

	return [ ...distDirPaths ];
}

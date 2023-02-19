import { resolve as resolvePath } from 'pathe';

const DEFAULT_METADATA = {
	name: 'test-package',
	author: 'Comandeer',
	license: 'MIT',
	version: '9.0.1'
};

function createPackageInfo( fixturePath, distMetadata = {}, projectMetadata = DEFAULT_METADATA ) {
	const parsedDistMetadata = Object.fromEntries( Object.entries( distMetadata ).map( ( metadata ) => {
		return createFileMetadata( fixturePath, metadata );
	} ) );

	return {
		...projectMetadata,
		dist: {
			...parsedDistMetadata
		}
	};
}

function createFileMetadata( fixturePath, [ filePath, entryPoints ] ) {
	const fullFilePath = resolvePath( fixturePath, filePath );
	const parsedEntryPoints = Object.fromEntries( Object.entries( entryPoints ).map( ( [ entryPointName, entryPointPath ] ) => {
		if ( entryPointName === 'type' ) {
			return [ entryPointName, entryPointPath ];
		}

		return [ entryPointName, resolvePath( fixturePath, entryPointPath ) ];
	} ) );

	return [ fullFilePath, parsedEntryPoints ];
}

export default createPackageInfo;

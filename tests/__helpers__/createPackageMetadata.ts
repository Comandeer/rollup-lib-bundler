import { resolve as resolvePath } from 'pathe';
import type { PackageMetadata, SubPathMetadata } from '../../src/packageParser.js';

const DEFAULT_METADATA: PackageMetadata = {
	project: '.',
	name: 'test-package',
	author: 'Comandeer',
	license: 'MIT',
	version: '9.0.1',
	dist: {},
	targets: {
		node: 'current'
	}
};

type SimplifiedSubPathMetadata = Exclude<SubPathMetadata, 'isBin'>;
type SimplifiedDistMetadata = Record<string, SimplifiedSubPathMetadata>;

export function createPackageMetadata(
	fixturePath: string,
	distMetadata: SimplifiedDistMetadata = {},
	projectMetadata = DEFAULT_METADATA
): PackageMetadata {
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

function createFileMetadata( fixturePath: string, [ filePath, entryPoints ]: [ string, SubPathMetadata ] ): [ string, SubPathMetadata ] {
	const fullFilePath = resolvePath( fixturePath, filePath );
	const parsedEntryPoints = Object.fromEntries( Object.entries( entryPoints ).map(
		( [ entryPointName, entryPointPath ]: [ keyof SimplifiedDistMetadata, string ] ): [ string, string ] => {
			if ( entryPointName === 'type' ) {
				return [ entryPointName, entryPointPath ];
			}

			return [ entryPointName, resolvePath( fixturePath, entryPointPath ) ];
		} ) ) as unknown as SubPathMetadata;

	return [ fullFilePath, parsedEntryPoints ];
}

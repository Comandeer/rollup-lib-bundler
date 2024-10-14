import { normalize as normalizePath } from 'pathe';
import loadAndParsePackageJSONFile, {
	PackageJSON,
	PackageJSONVersion
} from './packageParser/loadAndParsePackageJSONFile.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { type DistMetadata, prepareDistMetadata, type SubPathMetadata } from './packageParser/prepareDistMetadata.js';

export { DistMetadata, SubPathMetadata };

interface PackageMetadataTargets {
	readonly node: PackageJSONVersion | 'current';
}

export interface PackageMetadata {
	readonly project: string;
	readonly name: string;
	readonly version: PackageJSONVersion;
	readonly author: string;
	readonly license: string;
	readonly dist: DistMetadata;
	readonly targets: PackageMetadataTargets;
}

export default async function packageParser( packageDir: string ): Promise<PackageMetadata> {
	if ( typeof packageDir !== 'string' ) {
		throw new TypeError( 'Provide a path to a package directory.' );
	}

	const metadata = await loadAndParsePackageJSONFile( packageDir );

	return prepareMetadata( packageDir, metadata );
}

async function prepareMetadata( packageDir, metadata: PackageJSON ): Promise<PackageMetadata> {
	const project = normalizePath( packageDir );

	return {
		project,
		name: metadata.name,
		version: metadata.version,
		author: prepareAuthorMetadata( metadata.author ),
		license: metadata.license,
		dist: await prepareDistMetadata( packageDir, metadata ),
		targets: {
			node: 'current'
		}
	};
}

function prepareAuthorMetadata( author: PackageJSON['author'] ): string {
	if ( typeof author !== 'object' ) {
		return String( author );
	}

	return author.name;
}

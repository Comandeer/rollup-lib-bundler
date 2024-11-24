export type PackageJSONVersion = `${ number}.${ number }.${ number }`;

export type PackageJSONSubPath = '.' | `.${ string }`;

export interface PackageJSONConditionalExport {
	readonly import: string;
	readonly types?: string;
}

export type PackageJSONSubPathExports = Readonly<Record<PackageJSONSubPath, string | PackageJSONConditionalExport>>;

export type PackageJSONExports =
| string
| PackageJSONSubPathExports
| PackageJSONConditionalExport;

export type PackageJSONAuthor = string | {
	name: string;
};

export type PackageJSONBin = string | Record<string, string>;

export interface PackageJSONEngines {
	readonly node?: string;
}

export interface PackageJSON {
	readonly name: string;
	readonly version: PackageJSONVersion;
	readonly author: PackageJSONAuthor;
	readonly license: string;
	readonly exports: PackageJSONExports;
	readonly bin?: PackageJSONBin;
	readonly engines?: PackageJSONEngines;
}

export function isConditionalExport( obj: unknown ): obj is PackageJSONConditionalExport {
	return obj != null && typeof obj === 'object' && 'import' in obj;
}

export function isSubPathExports( obj: unknown ): obj is PackageJSONSubPathExports {
	return obj != null && Object.keys( obj ).every( ( key ) => {
		return isSubPath( key );
	} );
}

export function isSubPath( value: unknown ): value is PackageJSONSubPath {
	return typeof value === 'string' && value.startsWith( '.' );
}

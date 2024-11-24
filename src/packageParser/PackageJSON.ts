export type PackageJSONVersion = `${ number}.${ number }.${ number }`;

export type PackageJSONSubPath = '.' | `.${ string }`;

export interface PackageJSONConditionalExport {
	readonly import: string;
	readonly types?: string;
	readonly requires?: string;
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
	if ( obj === undefined || obj === null ) {
		return false;
	}

	const keys = Object.keys( obj );

	if ( keys.length === 0 ) {
		return false;
	}

	return keys.every( ( key ) => {
		return key === 'import' || key === 'types' || key === 'require';
	} );
}

export function isSubPathExports( obj: unknown ): obj is PackageJSONSubPathExports {
	if ( obj === undefined || obj === null ) {
		return false;
	}

	const keys = Object.keys( obj );

	if ( keys.length === 0 ) {
		return false;
	}

	return keys.every( ( key ) => {
		return isSubPath( key );
	} );
}

export function isSubPath( value: unknown ): value is PackageJSONSubPath {
	return typeof value === 'string' && value.startsWith( '.' );
}

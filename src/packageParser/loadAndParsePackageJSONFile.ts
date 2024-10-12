import { access, readFile } from 'node:fs/promises';
import { resolve as resolvePath } from 'pathe';

export type SemVerString = `${ number}.${ number }.${ number }`;

interface PackageJSONExports {
	readonly import?: string;
	readonly types?: string;
}

interface PackageJSONAuthor {
	name: string;
}

export interface PackageJSON {
	readonly name: string;
	readonly version: SemVerString;
	readonly author: string | PackageJSONAuthor;
	readonly license: string;
	readonly exports: string | PackageJSONExports;
	readonly bin?: string | Record<string, string>;
}

type UnvalidatedPackageJSON = Partial<PackageJSON>;

export default async function loadAndParsePackageJSONFile( dirPath: string ): Promise<PackageJSON> {
	const path = resolvePath( dirPath, 'package.json' );

	try {
		await access( path );
	} catch {
		throw new ReferenceError( 'The package.json does not exist in the provided location.' );
	}

	const contents = await readFile( path, 'utf8' );
	let parsed: UnvalidatedPackageJSON;

	try {
		parsed = JSON.parse( contents );
	} catch {
		throw new SyntaxError( 'The package.json file is not parsable as a correct JSON.' );
	}

	validatePackageJSON( parsed );

	return parsed as PackageJSON;
}

function validatePackageJSON( obj: UnvalidatedPackageJSON ): void {
	if ( typeof obj.name === 'undefined' ) {
		throw new ReferenceError( 'Package metadata must contain "name" property.' );
	}

	if ( typeof obj.version === 'undefined' ) {
		throw new ReferenceError( 'Package metadata must contain "version" property.' );
	}

	const isESMEntryPointPresent = typeof obj.exports === 'string' || typeof obj.exports?.[ '.' ] === 'string' ||
		typeof obj.exports?.import !== 'undefined' || typeof obj.exports?.[ '.' ]?.import !== 'undefined';

	if ( !isESMEntryPointPresent ) {
		throw new ReferenceError(
			'Package metadata must contain at least one of "exports[ \'.\' ].import" and "exports.import" properties ' +
			'or the "exports" property must contain the path.'
		);
	}

	if ( typeof obj.author === 'undefined' ) {
		throw new ReferenceError( 'Package metadata must contain "author" property.' );
	}

	if ( typeof obj.license === 'undefined' ) {
		throw new ReferenceError( 'Package metadata must contain "license" property.' );
	}
}

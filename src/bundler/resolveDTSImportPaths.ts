import { dirname, join as joinPath, extname } from 'pathe';

const virtualPrefix = '\0virtual:';
const virtualPrefixRegex = new RegExp( `^${ virtualPrefix }` );

export interface DTSImportPaths {
	id: string;
	tsSourceFilePath: string;
}

export function resolveDTSImportPaths( importee: string, importer: string ): DTSImportPaths {
	const originalExtension = extname( importee );
	const tsExtension = originalExtension.replace( /js$/, 'ts' );
	const originalExtensionRegex = new RegExp( `${ originalExtension }$` );
	const importeeWithTSExtension = importee.replace( originalExtensionRegex, `${ tsExtension }` );
	const importeeWithDTSExtension = importee.replace( originalExtensionRegex, `.d${ tsExtension }` );
	const importerWithoutVirtualPrefix = importer.replace( virtualPrefixRegex, '' );
	const importerDir = dirname( importerWithoutVirtualPrefix );
	const importeeFullPath = joinPath( importerDir, importeeWithDTSExtension );
	const tsSourceFilePath = joinPath( importerDir, importeeWithTSExtension );

	return {
		id: `${ virtualPrefix }${ importeeFullPath }`,
		tsSourceFilePath
	};
}

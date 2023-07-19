import { dirname, join as joinPath, extname } from 'pathe';

export default function fixDTSImportPaths() {
	const virtualPrefix = '\0virtual:';
	const virtualPrefixRegex = new RegExp( `^${ virtualPrefix }` );

	return {
		resolveId( importee, importer ) {
			// Skip the main file.
			if ( !importer ) {
				return null;
			}

			const originalExtension = extname( importee );
			const tsExtension = originalExtension.replace( /js$/, 'ts' );
			const originalExtensionRegex = new RegExp( `${ originalExtension }$` );
			const importeeWithDTSExtension = importee.replace( originalExtensionRegex, `.d${ tsExtension }` );
			const importerWithoutVirtualPrefix = importer.replace( virtualPrefixRegex, '' );
			const importerDir = dirname( importerWithoutVirtualPrefix );
			const importeeFullPath = joinPath( importerDir, importeeWithDTSExtension );

			return `${ virtualPrefix }${ importeeFullPath }`;
		}
	};
}

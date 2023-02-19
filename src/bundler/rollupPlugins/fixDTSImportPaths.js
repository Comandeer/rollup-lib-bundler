import { dirname } from 'node:path';
import { join as joinPath } from 'node:path';
import { normalize as normalizePath } from 'node:path/posix';
import { relative as getRelativePath } from 'node:path';

function fixDTSImportPaths( distMetadata ) {
	const virtualSrcPrefix = '\0virtual:src';

	return {
		resolveId( importee, importer ) {
			// Skip the main file.
			if ( !importer ) {
				return null;
			}

			const importerDir = dirname( importer );
			const jsExtensionRegex = /\.(m|c)?js$/;
			const originalExtension = importee.match( jsExtensionRegex )?.[ 0 ] ?? '';

			// We need a file path, with extension here.
			// Due to that we need to:
			// 1. Remove JS extension (in ESM-based projects
			//    TS tends to add it).
			// 2. Add the .d.ts extension.
			if ( !importee.endsWith( '.d.ts' ) ) {
				importee = `${ importee.replace( jsExtensionRegex, '' ) }.d.ts`;
			}

			const importeeFullPath = normalizePath( joinPath( importerDir, importee ) );
			const distImporteePath = importeeFullPath.replace( virtualSrcPrefix, './dist' );
			const isBundle = checkIfBundle( distMetadata, distImporteePath );

			if ( !isBundle ) {
				return importeeFullPath;
			}

			const distImporterPath = importer.replace( virtualSrcPrefix, './dist' );
			const distImporterDirectory = dirname( distImporterPath );
			const importeePathRelativeToImporter = getRelativePath( distImporterDirectory, distImporteePath );

			// As TS does not accept the .d.ts extension in import paths, we need to reused the original one.
			const importeeImportSpecifier = normalizePath( `./${ importeePathRelativeToImporter.
				replace( /\.d\.ts$/, originalExtension ) }` );

			return {
				id: importeeImportSpecifier,
				external: true
			};
		}
	};
}

function checkIfBundle( distMetadata, distPath ) {
	return Object.entries( distMetadata ).some( ( [ , { types } ] ) => {
		return types === distPath;
	} );
}

export default fixDTSImportPaths;

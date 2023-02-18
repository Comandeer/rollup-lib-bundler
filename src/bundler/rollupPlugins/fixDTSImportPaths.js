import { dirname } from 'node:path';
import { join as joinPath } from 'node:path';

function fixDTSImportPaths() {
	return {
		resolveId( importee, importer ) {
			// Skip the main file.
			if ( !importer ) {
				return null;
			}

			const importerDir = dirname( importer );
			const jsExtensionRegex = /\.(m|c)?js$/;

			importee = joinPath( importerDir, importee );

			// We need full file path, with extension here.
			// Due to that we need to:
			// 1. Remove JS extension (in ESM-based projects
			//    TS tends to add it).
			// 2. Add the .d.ts extension.
			if ( !importee.endsWith( '.d.ts' ) ) {
				importee = `${ importee.replace( jsExtensionRegex, '' ) }.d.ts`;
			}

			return importee;
		}
	};
}

export default fixDTSImportPaths;

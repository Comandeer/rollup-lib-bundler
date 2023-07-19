import MagicString from 'magic-string';
import { dirname, relative as getRelativePath, resolve as resolvePath } from 'pathe';

export default function resolveOtherBundles( projectPath, metadata ) {
	return {
		name: 'rlb-resolve-other-bundles',

		async resolveId( importee, importer ) {
			if ( !importee.startsWith( '.' ) ) {
				return null;
			}

			const resolved = await this.resolve( importee, importer, {
				skipSelf: true
			} );
			const srcFullPath = resolved.id;
			const srcPathRelativeToProject = getRelativePath( projectPath, srcFullPath );
			const isBundle = typeof metadata[ srcPathRelativeToProject ] !== 'undefined';

			if ( !isBundle ) {
				return null;
			}

			const distPlaceholderPath = `rlb:${ srcPathRelativeToProject }`;

			return {
				id: distPlaceholderPath,
				external: true
			};
		},

		async renderChunk( code, chunk, { file } ) {
			const chunkFullPath = resolvePath( projectPath, file );
			const magicString = new MagicString( code );

			magicString.replaceAll( /(?:import|export).+?from\s*["'](rlb:.+?)["']/g, ( importOrExportString, importee ) => {
				const bundlePath = getCorrectImportPath( importee, metadata, chunkFullPath );

				return importOrExportString.replace( importee, bundlePath );
			} );

			const transformedCode = magicString.toString();
			const map = magicString.generateMap();

			return {
				code: transformedCode,
				map
			};
		}
	};

	function getCorrectImportPath( importee, metadata, importerFullPath ) {
		const srcPathRelativeToProject = importee.slice( 4 );
		const distPathRelativeToProject = metadata[ srcPathRelativeToProject ].esm;
		const distFullPath = resolvePath( projectPath, distPathRelativeToProject );
		const chunkDirectoryPath = dirname( importerFullPath );
		const distPathRelativeToChunk = getRelativePath( chunkDirectoryPath, distFullPath );
		const importPath = distPathRelativeToChunk.startsWith( '.' ) ?
			distPathRelativeToChunk :
			`./${ distPathRelativeToChunk }`;

		return importPath;
	}
}

import MagicString from 'magic-string';
import { dirname, relative as getRelativePath, resolve as resolvePath } from 'pathe';
import fixDTSImportPaths from '../fixDTSImportPaths.js';

export default function resolveOtherBundles( projectPath, metadata, {
	isTypeBundling = false
} = {} ) {
	return {
		name: 'rlb-resolve-other-bundles',

		async resolveId( importee, importer ) {
			if ( !importee.startsWith( '.' ) || !importer ) {
				return null;
			}

			const resolved = isTypeBundling ?
				fixDTSImportPaths( importee, importer ) :
				await this.resolve( importee, importer, {
					skipSelf: true
				} );
			const srcPathRelativeToProject = getSrcPathRelativeToProject( projectPath, resolved, isTypeBundling );
			const isBundle = checkIfBundle( srcPathRelativeToProject, metadata, isTypeBundling );

			if ( !isBundle ) {
				return isTypeBundling ? resolved.id : null;
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

	function getSrcPathRelativeToProject( projectPath, resolved, isTypeBundling ) {
		if ( isTypeBundling ) {
			return resolved.tsSourceFilePath;
		}

		return getRelativePath( projectPath, resolved.id );
	}

	function checkIfBundle( srcPath, metadata, isTypeBundling ) {
		const isEntryPreset = typeof metadata[ srcPath ] !== 'undefined';

		if ( !isTypeBundling ) {
			return isEntryPreset;
		}

		return isEntryPreset && metadata[ srcPath ].types;
	}
}

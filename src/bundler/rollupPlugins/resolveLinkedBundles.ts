import MagicString from 'magic-string';
import { dirname, relative as getRelativePath, resolve as resolvePath } from 'pathe';
import resolveDTSImportPaths, { DTSImportPaths } from '../resolveDTSImportPaths.js';
import { NormalizedOutputOptions, PartialResolvedId, Plugin, ResolveIdResult, SourceMapInput } from 'rollup';
import { DistMetadata } from '../../packageParser.js';

interface ResolveLinkedBundlesOptions {
	isTypeBundling?: boolean;
}

interface RenderChunkResult {
	code: string;
	map: SourceMapInput;
}

export default function resolveLinkedBundles( projectPath: string, metadata: DistMetadata, {
	isTypeBundling = false
}: ResolveLinkedBundlesOptions = {} ): Plugin {
	return {
		name: 'rlb-resolve-other-bundles',

		async resolveId( importee, importer ): Promise<ResolveIdResult> {
			if ( !importee.startsWith( '.' ) || typeof importer !== 'string' ) {
				return null;
			}

			const resolved = isTypeBundling ?
				resolveDTSImportPaths( importee, importer ) :
				await this.resolve( importee, importer, {
					skipSelf: true
				} );
			const srcPathRelativeToProject = getSrcPathRelativeToProject( projectPath, resolved!, isTypeBundling );
			const isBundle = checkIfBundle( srcPathRelativeToProject, metadata, isTypeBundling );

			if ( !isBundle ) {
				return isTypeBundling ? resolved!.id : null;
			}

			const distPlaceholderPath = `rlb:${ srcPathRelativeToProject }`;

			return {
				id: distPlaceholderPath,
				external: true
			};
		},

		async renderChunk( code: string, chunk, { file }: NormalizedOutputOptions ): Promise<RenderChunkResult> {
			const chunkFullPath = resolvePath( projectPath, file! );
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

	function getCorrectImportPath( importee: string, metadata: DistMetadata, importerFullPath: string ): string {
		const srcPathRelativeToProject = importee.slice( 4 );
		const distPathRelativeToProject = metadata[ srcPathRelativeToProject ]!.esm;
		const distFullPath = resolvePath( projectPath, distPathRelativeToProject );
		const chunkDirectoryPath = dirname( importerFullPath );
		const distPathRelativeToChunk = getRelativePath( chunkDirectoryPath, distFullPath );
		const importPath = distPathRelativeToChunk.startsWith( '.' ) ?
			distPathRelativeToChunk :
			`./${ distPathRelativeToChunk }`;

		return importPath;
	}

	function getSrcPathRelativeToProject(
		projectPath: string,
		resolved: PartialResolvedId | DTSImportPaths,
		isTypeBundling: boolean
	): string {
		if ( isTypeBundling && 'tsSourceFilePath' in resolved ) {
			return resolved.tsSourceFilePath;
		}

		return getRelativePath( projectPath, resolved.id );
	}

	function checkIfBundle( srcPath: string, metadata: DistMetadata, isTypeBundling: boolean ): boolean {
		const entryPoint = metadata[ srcPath ];
		const isEntryPoint = typeof entryPoint !== 'undefined';

		if ( !isTypeBundling ) {
			return isEntryPoint;
		}

		return isEntryPoint && entryPoint.types !== undefined;
	}
}

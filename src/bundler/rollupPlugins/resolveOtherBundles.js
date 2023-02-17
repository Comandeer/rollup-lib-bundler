import { dirname } from 'node:path';
import { relative as getRelativePath } from 'node:path';
import { resolve as resolvePath } from 'node:path';
import { transformAsync } from '@babel/core';
import * as t from '@babel/types';

function resolveOtherBundles( projectPath, metadata ) {
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
			const { code: transformedCode, map } = await transformAsync( code, {
				plugins: [
					transformImports( projectPath, metadata, chunkFullPath )
				]
			} );

			return {
				code: transformedCode,
				map
			};
		}
	};
}

function transformImports( projectPath, metadata, importerFullPath ) {
	return {
		visitor: {
			ImportDeclaration( path ) {
				const { node } = path;
				const { value: importee } = node.source;

				if ( !importee.startsWith( 'rlb:' ) ) {
					return;
				}

				const importPath = getCorrectImportPath( importee, 'esm' );

				path.replaceWith(
					t.importDeclaration(
						node.specifiers,
						t.stringLiteral( importPath )
					)
				);
			},

			ExportNamedDeclaration( path ) {
				const { node } = path;
				const { source } = node;

				if ( !source || !source.value.startsWith( 'rlb:' ) ) {
					return;
				}

				const importPath = getCorrectImportPath( source.value, 'esm' );

				path.replaceWith(
					t.exportNamedDeclaration(
						node.declaration,
						node.specifiers,
						t.stringLiteral( importPath )
					)
				);
			},

			ExportAllDeclaration( path ) {
				const { node } = path;
				const { source } = node;

				if ( !source.value.startsWith( 'rlb:' ) ) {
					return;
				}

				const importPath = getCorrectImportPath( source.value, 'esm' );

				path.replaceWith(
					t.exportAllDeclaration(
						t.stringLiteral( importPath )
					)
				);
			},

			CallExpression( path ) {
				const { node } = path;
				const { callee, arguments: args } = node;

				if ( !t.isIdentifier( callee ) || callee.name !== 'require' ) {
					return;
				}

				const [ requiredModuleArg ] = args;

				if ( !t.isStringLiteral( requiredModuleArg ) ) {
					return;
				}

				const importee = requiredModuleArg.value;

				if ( !importee.startsWith( 'rlb:' ) ) {
					return;
				}

				const importPath = getCorrectImportPath( importee, 'cjs' );

				path.replaceWith(
					t.callExpression(
						t.identifier( 'require' ),
						[
							t.stringLiteral( importPath )
						]
					)
				);
			}
		}
	};

	function getCorrectImportPath( importee, importType ) {
		const srcPathRelativeToProject = importee.slice( 4 );
		const distPathRelativeToProject = metadata[ srcPathRelativeToProject ][ importType ];
		const distFullPath = resolvePath( projectPath, distPathRelativeToProject );
		const chunkDirectoryPath = dirname( importerFullPath );
		const distPathRelativeToChunk = getRelativePath( chunkDirectoryPath, distFullPath );
		const importPath = distPathRelativeToChunk.startsWith( '.' ) ?
			distPathRelativeToChunk :
			`./${ distPathRelativeToChunk }`;

		return importPath;
	}
}

export default resolveOtherBundles;

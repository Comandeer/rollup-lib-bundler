import { relative as getRelativePath } from 'node:path';

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
		}
	};

}

export default resolveOtherBundles;

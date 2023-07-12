import { chmod } from 'node:fs/promises';
import { resolve as resolvePath } from 'pathe';

async function fixBinPermissions( projectPath, { esm } ) {
	const binFilePath = resolvePath( projectPath, esm );

	return chmod( binFilePath, '755' );
}

export default fixBinPermissions;

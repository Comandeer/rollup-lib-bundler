import { chmod } from 'node:fs/promises';
import { resolve as resolvePath } from 'pathe';
import { SubPathMetadata } from '../packageParser.js';

export default async function fixBinPermissions( projectPath: string, { esm }: SubPathMetadata ): Promise<void> {
	const binFilePath = resolvePath( projectPath, esm );

	return chmod( binFilePath, '755' );
}

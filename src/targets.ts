import { readFile } from 'node:fs/promises';
import { resolve as resolvePath } from 'pathe';
import getDirName from './utils/getDirName.js';

interface PackageJSON {
	engines: {
		node: string;
	};
}

const __dirname = getDirName( import.meta.url );
const packageJSONFilePath = resolvePath( __dirname, '..', 'package.json' );
const packageJSONFileContent = await readFile( packageJSONFilePath, 'utf8' );
const { engines }: PackageJSON = JSON.parse( packageJSONFileContent );

const node = engines.node.replace( /[<=>~^]/g, '' );

export { node };

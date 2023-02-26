import { readFile } from 'node:fs/promises';
import { resolve as resolvePath } from 'node:path';
import getDirName from '../src/utils/getDirName.js';

const __dirname = getDirName( import.meta.url );
const packageJSONFilePath = resolvePath( __dirname, '..', 'package.json' );
const packageJSONFileContent = await readFile( packageJSONFilePath, 'utf8' );
const { engines } = JSON.parse( packageJSONFileContent );

const node = engines.node.replace( /[<=>~^]/g, '' );

export { node };

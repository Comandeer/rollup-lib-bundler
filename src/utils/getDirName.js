import { dirname } from 'path';
import { fileURLToPath } from 'url';

function getDirName( url ) {
	const __dirname = dirname( fileURLToPath( url ) );

	return __dirname;
}

export default getDirName;

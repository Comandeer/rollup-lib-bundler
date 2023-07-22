import { fileURLToPath } from 'node:url';
import { dirname } from 'pathe';

export default function getDirName( url: string | URL ): string {
	const __dirname = dirname( fileURLToPath( url ) );

	return __dirname;
}

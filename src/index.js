import generateBanner from './generateBanner.js';
import packageParser from './packageParser.js';
import bundler from './bundler';

function rlb() {
	const metadata = packageParser( 'package.json' );

	return bundler( metadata );
}

export default rlb;
export { bundler };
export { packageParser };
export { generateBanner };

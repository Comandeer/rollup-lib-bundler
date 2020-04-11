import packageParser from './packageParser.js';
import bundler from './bundler.js';

function rlb() {
	const metadata = packageParser( 'package.json' );

	return bundler( metadata );
}

export default rlb;

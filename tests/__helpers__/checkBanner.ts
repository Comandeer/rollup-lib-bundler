// eslint-disable-next-line ava/use-test
import { ExecutionContext } from 'ava';

export default function checkBanner( t: ExecutionContext, fileContent: string ): void {
	// Yeah, I know…
	const bannerRegex = /^(?<shebang>#!\/usr\/bin\/env node\n)?(?<banner>\/\*! .+? v\d+\.\d+\.\d+ \| \(c\) \d{4} .+? \| .+? license \(see LICENSE\) \*\/\n)(?!.*\k<banner>)/g;

	t.regex( fileContent, bannerRegex, 'Banner is present' );
}

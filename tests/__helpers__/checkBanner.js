/**
 *
 * @param {import('ava').ExecutionContext<unknown>} t
 * @param {string} fileContent
 * @returns {void}
 */
export default function checkBanner( t, fileContent ) {
	// Yeah, I know…
	const bannerRegex = /^(?<shebang>#!\/usr\/bin\/env node\n)?(?<banner>\/\*! .+? v\d+\.\d+\.\d+ \| \(c\) \d{4} .+? \| .+? license \(see LICENSE\) \*\/\n)(?!.*\k<banner>)/g;

	t.regex( fileContent, bannerRegex, 'Banner is present' );
}

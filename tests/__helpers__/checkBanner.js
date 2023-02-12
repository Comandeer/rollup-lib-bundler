/**
 *
 * @param {import('ava').ExecutionContext<unknown>} t
 * @param {string} fileContent
 * @returns {void}
 */
function checkBanner( t, fileContent ) {
	// Yeah, I know…
	const bannerRegex = /^(?<banner>\/\*! .+? v\d+\.\d+\.\d+ \| \(c\) \d{4} .+? \| .+? license \(see LICENSE\) \*\/\n)(?!.*\k<banner>)/g;
	const match = fileContent.match( bannerRegex );

	t.is( match.length, 1 );
}

export default checkBanner;

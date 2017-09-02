function generateBanner( metadata ) {
	return `/*! ${metadata.name} v${metadata.version} | (c) ${new Date().getFullYear()} ${metadata.author} | ${metadata.license} license (see LICENSE) */`;
}

export default generateBanner;

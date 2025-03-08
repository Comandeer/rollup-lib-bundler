import type { PackageMetadata } from './packageParser.js';

export function generateBanner( metadata: PackageMetadata ): string {
	return `/*! ${ metadata.name } v${ metadata.version } | (c) ${new Date().getFullYear()} ${ metadata.author } | ${ metadata.license } license (see LICENSE) */`;
}

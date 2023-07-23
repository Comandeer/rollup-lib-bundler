import { Plugin } from 'rollup';

interface RenderDynamicImportResult {
	left: string;
	right: string;
}

export default function preserveDynamicImports(): Plugin {
	return {
		name: 'rlb-preserve-dynamic-imports',

		renderDynamicImport(): RenderDynamicImportResult {
			return {
				left: 'import(',
				right: ');'
			};
		}
	};
}

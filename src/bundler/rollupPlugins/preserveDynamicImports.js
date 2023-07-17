export default function preserveDynamicImports() {
	return {
		renderDynamicImport() {
			return {
				left: 'import(',
				right: ');'
			};
		}
	};
}

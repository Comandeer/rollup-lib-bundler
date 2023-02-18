function preserveDynamicImports() {
	return {
		renderDynamicImport() {
			return {
				left: 'import(',
				right: ');'
			};
		}
	};
}

export default preserveDynamicImports;

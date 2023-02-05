const config = {
	files: [
		'tests/ava/**',
		'!tests/**/{__fixtures__,__helpers__}/**'
	],
	require: [
		'tests/__helpers__/avaBabelHook.js'
	]
};

export default config;

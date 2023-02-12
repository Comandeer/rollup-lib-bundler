const config = {
	files: [
		'tests/**/*.js',
		'!tests/**/{__fixtures__,__helpers__}/**'
	],
	require: [
		'./tests/__helpers__/avaBabelHook.js'
	]
};

export default config;

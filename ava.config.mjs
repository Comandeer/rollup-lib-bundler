const config = {
	// https://github.com/avajs/ava/issues/2947
	workerThreads: false,
	files: [
		'tests/**/*.js',
		'!tests/**/{__fixtures__,__helpers__}/**'
	],
	require: [
		'./tests/__helpers__/avaBabelHook.js'
	]
};

export default config;

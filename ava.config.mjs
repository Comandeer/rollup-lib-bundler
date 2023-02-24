const config = {
	// https://github.com/avajs/ava/issues/2947
	workerThreads: false,
	timeout: '30s',
	files: [
		'tests/**/*.js',
		'!tests/**/{__fixtures__,__helpers__}/**'
	]
};

export default config;

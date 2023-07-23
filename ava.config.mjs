const config = {
	extensions: {
		ts: 'module'
	},
	// https://github.com/avajs/ava/issues/2947
	workerThreads: false,
	timeout: '30s',
	files: [
		'tests/**/*.{js,ts}',
		'!tests/**/{__fixtures__,__helpers__}/**'
	],
	nodeArguments: [
		'--loader=tsx'
	]
};

export default config;

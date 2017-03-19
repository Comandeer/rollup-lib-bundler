# @comandeer/rollup-lib-bundler [![Build Status](https://travis-ci.org/Comandeer/rollup-lib-bundler.svg?branch=master)](https://travis-ci.org/Comandeer/rollup-lib-bundler) [![Dependency Status](https://david-dm.org/Comandeer/rollup-lib-bundler.svg)](https://david-dm.org/Comandeer/rollup-lib-bundler) [![devDependencies Status](https://david-dm.org/Comandeer/rollup-lib-bundler/dev-status.svg)](https://david-dm.org/Comandeer/rollup-lib-bundler?type=dev)

Super opinionated library bundler using Rollup, Babel, Babili and Uglify.js.

## How does it work?

It gets `package.json` from the current working directory, parses it and get neeeded info:

* `name`, `author`, `version` and `license` to create beautiful banner comment,
* `main` to get path for saving ES5 bundle,
* `module` or `jsnext:main` for saving ES2015 bundle.

Of course it treats `src/index.js` as the only entry point for Rollup.

## Installation

```bash
npm install @comandeer/rollup-lib-bundler --save-dev
```

## Usage

Just make it a npm script:

```json
"scripts": {
	"build": "rlb"
}
```

## Configuration

No configuration. Consider it a feature.

## License

See [LICENSE](./LICENSE) file for details.

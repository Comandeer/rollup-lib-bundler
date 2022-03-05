# @comandeer/rollup-lib-bundler

[![Build Status](https://github.com/Comandeer/rollup-lib-bundler/workflows/CI/badge.svg)](https://github.com/Comandeer/rollup-lib-bundler/actions) [![codecov](https://codecov.io/gh/Comandeer/rollup-lib-bundler/branch/main/graph/badge.svg)](https://codecov.io/gh/Comandeer/rollup-lib-bundler) [![npm (scoped)](https://img.shields.io/npm/v/@comandeer/rollup-lib-bundler.svg)](https://npmjs.com/package/@comandeer/rollup-lib-bundler)

Super opinionated library bundler using [Rollup](https://github.com/rollup/rollup), [Babel](https://github.com/babel/babel) and [terser](https://github.com/terser/terser).

## How does it work?

It gets `package.json` from the current working directory, parses it and get neeeded info:

* `name`, `author`, `version` and `license` to create beautiful banner comment,
* `exports.require` or `main` to get path for saving CJS bundle,
* `exports.import`, `module` or `jsnext:main` for saving ESM bundle.

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

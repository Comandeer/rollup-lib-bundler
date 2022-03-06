# @comandeer/rollup-lib-bundler

[![Build Status](https://github.com/Comandeer/rollup-lib-bundler/workflows/CI/badge.svg)](https://github.com/Comandeer/rollup-lib-bundler/actions) [![codecov](https://codecov.io/gh/Comandeer/rollup-lib-bundler/branch/main/graph/badge.svg)](https://codecov.io/gh/Comandeer/rollup-lib-bundler) [![npm (scoped)](https://img.shields.io/npm/v/@comandeer/rollup-lib-bundler.svg)](https://npmjs.com/package/@comandeer/rollup-lib-bundler)

Super opinionated library bundler using [Rollup](https://github.com/rollup/rollup), [Babel](https://github.com/babel/babel) and [terser](https://github.com/terser/terser).

## How does it work?

It gets `package.json` from the current working directory, parses it and get neeeded info:

* `name`, `author`, `version` and `license` to create beautiful banner comment,
* `exports.require` or `main` to get path for saving CJS bundle,
* `exports.import`, `module` or `jsnext:main` for saving ESM bundle.

The default entry point for Rollup is `src/index.js`.

### Multiple bundles

By default, `src/index.js` is treated as the only entry point. However, using [subpath exports](https://nodejs.org/api/packages.html#subpath-exports) you can create several bundled chunks/files. Example:

```json
"exports": {
	".": {
		"require": "./dist/es5.cjs",
		"import": "./dist/es6.mjs"
	},

	"./chunk": {
		"require": "./dist/chunk.cjs",
		"import": "./dist/chunk.mjs"
	}
}
```

In this case two source files will be bundled:
* `src/index.js`:
	* ESM output: `dist/es6.mjs`,
	* CJS output: `dist/es5.cjs`,
* `src/chunk.js`:
	* ESM output: `dist/chunk.mjs`,
	* CJS output: `dist/chunk.cjs`.

Although Node.js supports several different syntaxes for subpath exports, this bundler supports only the form presented on the example above (so each subpath needs two properties – `require` for CJS bundle and `import` for ESM bundle).

Each subpath is translated to appropriate file in `src` directory. Basically, `./` at the beginning is translated to `src/` and the name of the subpath is translated to `<subpath>.js` (e.g. `./chunk` → `src/chunk.js`). The only exception is the `.` subpath, which is translated to `src/index.js`.

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

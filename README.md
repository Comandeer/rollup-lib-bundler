# @comandeer/rollup-lib-bundler

[![Build Status](https://github.com/Comandeer/rollup-lib-bundler/workflows/CI/badge.svg)](https://github.com/Comandeer/rollup-lib-bundler/actions) [![codecov](https://codecov.io/gh/Comandeer/rollup-lib-bundler/branch/main/graph/badge.svg)](https://codecov.io/gh/Comandeer/rollup-lib-bundler) [![npm (scoped)](https://img.shields.io/npm/v/@comandeer/rollup-lib-bundler.svg)](https://npmjs.com/package/@comandeer/rollup-lib-bundler)

Super opinionated library bundler using [Rollup](https://github.com/rollup/rollup), [Babel](https://github.com/babel/babel) and [terser](https://github.com/terser/terser).

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

## How does it work?

It gets `package.json` from the current working directory, parses it and get neeeded info:

* `name`, `author`, `version` and `license` to create beautiful banner comment,
* `exports.require` or `main` to get path for saving CJS bundle,
* `exports.import`, `module` or `jsnext:main` for saving ESM bundle.

Then the bundling happens. The default entry point for Rollup is `src/index.js`. Please note that **`dist/` directory is purged before bundling**! So if anything should be there alongside the bundle, it should be added there _after_ the bundling.

### Assumed file structure

This is very opinionated bundler and it assumes that the project's file structure looks like the one below:

```
package/
|- package.json
|- src/
|     |- index.js
|     |- some-other-chunk.js
|- dist/
|      |- bundled-index.cjs
|      |- bundled-index.cjs.map
|      |- bundled-index.mjs
|      |- bundled-index.mjs.map
|      |- bundled-some-other-chunk.cjs
|      |- bundled-some-other-chunk.cjs.map
|      |- bundled-some-other-chunk.mjs
|      |- bundled-some-other-chunk.mjs.map
```

* `package.json` is in the root of the package (the only bit we all agree on!),
* `src/` directory contains package's source,
	* `index.js` is the main entrypoint of the package,
	* `some-other-chunk.js` is the optional additional entrypoint (see [#mutliple-bundles](Multiple bundles) section for more info),
* `dist/` directory contains bundled code.

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

## License

See [LICENSE](./LICENSE) file for details.

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
* `exports.import` for saving ESM bundle.

Then the bundling happens. The default entry point for Rollup is `src/index.js`. Please note that **dist directory is purged before bundling**! So if anything should be there alongside the bundle, it should be added there _after_ the bundling.

### Assumed file structure

This is very opinionated bundler and it assumes that the project's file structure looks like the one below:

```
package/
|- package.json
|- src/
|     |- index.js
|     |- some-other-chunk.js
|- dist/
|      |- bundled-index.mjs
|      |- bundled-index.mjs.map
|      |- bundled-some-other-chunk.mjs
|      |- bundled-some-other-chunk.mjs.map
```

* `package.json` is in the root of the package (the only bit we all agree on!),
* `src/` directory contains package's source,
	* `index.js` is the main entrypoint of the package,
	* `some-other-chunk.js` is the optional additional entrypoint (see [#mutliple-bundles](Multiple bundles) section for more info),
* `dist/` directory contains bundled code.

Bundler search for source files with the following extensions in the following order:

* `.mts`,
* `.ts`,
* `.mjs`,
* `.js`,
* `.cts`,
* `.cjs`.

### Multiple bundles

By default, `src/index.js` is treated as the only entry point. However, using [subpath exports](https://nodejs.org/api/packages.html#subpath-exports) you can create several bundled chunks/files. Example:

```json
"exports": {
	".": {
		"import": "./dist/package.mjs"
	},

	"./chunk": {
		"import": "./dist/chunk.mjs"
	}
}
```

In this case two source files will be bundled:
* `src/index.js`:
	* ESM output: `dist/package.mjs`,
* `src/chunk.js`:
	* ESM output: `dist/chunk.mjs`.

Although Node.js supports several different syntaxes for subpath exports, this bundler supports only the form presented on the example above (so each subpath an `import` property for ESM bundle).

Each subpath is translated to appropriate file in `src` directory. Basically, `./` at the beginning is translated to `src/` and the name of the subpath is translated to `<subpath>.<extension>` (e.g. `./chunk` → `src/chunk.js`). The only exception is the `.` subpath, which is translated to `src/index.js`.

As of version 0.19.0 the bundler also automatically omits bundling bundles inside other bundles. If there were an import of the `src/chunk.js` file inside the `src/index.js` file in the above structure, then the `dist/package.(c|m)js` file would contain an import from `dist/chunk.(c|m)js` file instead of the content of the other bundle.

## TypeScript support

Starting from v0.17.0 the bundler is able also to bundle TypeScript projects. There is no configuration needed, just replace the `.js` extension with the `.ts` one! Also ensure that there's a valid `tsconfig.json` file in the root of your project. If you want to provide different configuration for the bundler, place a `tsconfig.rlb.json` file instead.

> [!WARNING]
> The [`outDir` config option](https://www.typescriptlang.org/tsconfig/#outDir) is overridden by the bundler to point to the same directory as the one in the Rollup's configuration.
> See [#327](https://github.com/Comandeer/rollup-lib-bundler/issues/327) for more details.

The bundler also bundles `.d.ts` files but only if you specified the `exports.types` field in your `package.json`.

Sample configuration for a TS project:

```json
"exports": {
	".": {
		"types": "./dist/index.d.ts",
		"import": "./dist/index.mjs"
	},

	"./chunk": {
		"import": "./dist/chunk.mjs"
	}
}
```

In this case two source files will be bundled:
* `src/index.ts`:
	* ESM output: `dist/index.mjs`,
	* DTS output: `dist/index.d.ts`,
* `src/chunk.ts`:
	* ESM output: `dist/chunk.mjs`,
	* DTS output: none (there's no `types` field).

## Bundling executables (aka binaries)

From v0.19.0 `rlb` can also bundle executables defined in the [`bin` field](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#bin) of the `package.json`. It supports both the simple format of that field and the complex one. Source files for binaries must be placed in the `src/__bin__` directory with the same name as in the `bin` field. All source file formats supported for `exports` bundles are also supported for the `bin` ones.

All bundles created from the `bin` field are saved in the ESM format. The bundler will also preserve shebang in the produced bundle.

### Example with the simple `bin` format

```json
{
	"name": "some-package",
	"exports": {
		".": {
			"import": "./dist/index.mjs"
		}
	},
	"bin": "./dist/bin.mjs"
}
```

In that case bundler excepts the following source file structure:

```
some-package/
|- package.json
|- src/
|     |- index.js
|     |- __bin__/
|     |         |- some-package.js
```

Please note that when using the simple `bin` format (so just the path to the executable, without its name), the bundler will look for the source file with the name of the package (derived from the `name` field in the `package.json` files).

### Example with the complex `bin` format

```json
{
	"name": "some-package",
	"exports": {
		".": {
			"import": "./dist/index.mjs"
		}
	},
	"bin": {
		"whatever": "./dist/bin.mjs",
		"another-one": "./dist/bin2.js"
	}
}
```

In that case bundler excepts the following source file structure:

```
some-package/
|- package.json
|- src/
|     |- index.js
|     |- __bin__/
|     |         |- whatever.js
|     |         |- another-one.js
```

## Support for non-standard dist directories

From v0.20.0 the bundler officially supports non-standard dist directories (different than the `./dist` one). The dist directory is resolved from the `exports` field in the `package.json`, e.g.:

```json
"exports": {
	".": {
		"import": "./hublabubla/package.mjs"
	}
}
```

In the above example, the `./hublabubla` directory will be used instead of the `./dist` one.

The bundler supports also multiple non-standard dist directories, e.g.:

```json
"exports": {
	".": {
		"import": "./bublahubla/package.mjs"
	},
	"./chunk": "./hublabubla/chunk.mjs"
}
```

> [!WARNING]
> Non-standard dist directories are purged befored the bundling!
> So if anything should be there alongside the bundle, it should be added there _after_ the bundling.

## Configuring VSC to correctly suggest imports

VSC uses TypeScript rules to suggest imports. However, TS uses CJS rules by default, ignoring the constraints of the `exports` field and suggesting the whole file paths (e.g. `<package>/dist/<file>` instead of `<package>/<submodule-name>`). To fix it, TS must be configured by `tsconfig.json` or `jsconfig.json` file to [resolve modules according to ESM rules](https://www.typescriptlang.org/tsconfig#moduleResolution):

```json5
{
	"module": "node16",
	// or
	"moduleResolution": "node16"
}
```


## License

See [LICENSE](./LICENSE) file for details.

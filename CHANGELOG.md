# @comandeer/rollup-lib-bundler Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

---

## [0.24.0]
### Changed
* [#321]: **BREAKING CHANGE**: updated dependencies:

  | Dependency                               | Old version | New version |
  | ---------------------------------------- | ----------- | ----------- |
  | `@babel/core`                            | `^7.24.5`   | `^7.25.7`   |
  | `@babel/plugin-syntax-import-assertions` | `^7.24.1`   | `^7.25.7`   |
  | `@babel/preset-env`                      | `^7.24.5`   | `^7.25.7`   |
  | ⚠️ `@rollup/plugin-commonjs`              | `^25.0.7`   | `^28.0.0`   |
  | ⚠️ `@rollup/plugin-typescript`            | `^11.1.6`   | `^12.1.0`   |
  | `globby`                                 | `^14.0.1`   | `^14.0.2`   |
  | `magic-string`                           | `^0.30.1`   | `^0.30.11`  |
  | ⚠️ `rimraf`                               | `^5.0.5`    | `^6.0.1`    |
  | `rollup`                                 | `^4.17.2`   | `^4.24.0`   |
  | `rollup-plugin-dts`                      | `^6.1.0`    | `^6.1.1`    |
  | `tslib`                                  | `^2.6.2`    | `^2.7.0`    |
  | `typescript`                             | `^5.4.5`    | `^5.6.2`    |

  Dependencies with major version change are marked with the "⚠️" emoji.

## [0.23.0] – 2024-05-01
### Added
* [#314]: support for Node 22.

### Changed
* [#311]: **BREAKING CHANGE**: updated dependencies:

	| Dependency                               | Old version | New version |
	| ---------------------------------------- | ----------- | ----------- |
	| `@babel/core`                            | `^7.22.0`   | `^7.24.5`   |
	| `@babel/plugin-syntax-import-assertions` | `^7.22.5`   | `^7.24.1`   |
	| `@babel/preset-env`                      | `^7.22.9`   | `^7.24.5`   |
	| ⚠️ `@comandeer/cli-spinner`               | `^0.3.2`    | `^1.0.2`    |
	| `@rollup/plugin-babel`                   | `^6.0.3`    | `^6.0.4`    |
	| `@rollup/plugin-commonjs`                | `^25.0.2`   | `^25.0.7`   |
	| `@rollup/plugin-json`                    | `^6.0.0`    | `^6.1.0`    |
	| `@rollup/plugin-terser`                  | `^0.4.3`    | `^0.4.4`    |
	| `@rollup/plugin-typescript`              | `^11.1.2`   | `^11.1.6`   |
	| `@rollup/plugin-virtual`                 | `^3.0.1`    | `^3.0.2`    |
	| ⭐ `chalk`                                | N/A         | `^5.3.0`    |
	| ☠️ `console-control-strings`              | `^1.1.0`    | N/A         |
	| ⚠️ `globby`                               | `^13.2.2`   | `^14.0.1`   |
	| `pathe`                                  | `^1.1.1`    | `^1.1.2`    |
	| `rimraf`                                 | `^5.0.1`    | `^5.0.5`    |
	| ⚠️ `rollup`                               | `^3.26.2`   | `^4.17.2`   |
	| ⚠️ `rollup-plugin-dts`                    | `^5.3.0`    | `^6.1.0`    |
	| `tslib`                                  | `^2.6.0`    | `^2.6.2`    |
	| `typescript`                             | `^5.1.6`    | `^5.4.5`    |

	New dependencies are marked with the "⭐" emoji.

	Dependencies with major version change are marked with the "⚠️" emoji.

	Removed dependencies are marked with the "☠️" emoji.

### Removed
* [#314]: **BREAKING CHANGE**: support for Node 16 & 18.

## [0.22.1] – 2023-07-28
### Fixed
* [#303]: incorrect package published on GitHub.
* [#306]: incorrect orderd of `exports` in the `package.json` file.

## [0.22.0] – 2023-07-23
### Added
* [#232]: type definitions for the library.

### Changed
* [#232]: **BREAKING CHANGE**: rewrote the project in TS.

## [0.21.0] – 2023-07-20
### Changed
* [#300]: **BREAKING CHANGE**: updated the logic for linking to other bundles.
* [#279]: **BREAKING CHANGE**: updated dependencies:

	| Dependency                               | Old version | New version |
	| ---------------------------------------- | ----------- | ----------- |
	| `@babel/core`                            | `^7.20.12`  | `^7.22.9`   |
	| `@babel/plugin-syntax-import-assertions` | `^7.20.0`   | `^7.22.5`   |
	| ☠️ `@babel/plugin-transform-typescript`   | `^7.20.13`  | N/A         |
	| `@babel/preset-env`                      | `^7.20.2`   | `^7.22.9`   |
	| ☠️ `@babel/types`                         | `^7.20.7`   | N/A         |
	| ⚠️ `@rollup/plugin-commonjs`              | `^24.0.0`   | `^25.0.2`   |
	| ⚠️ `@rollup/plugin-terser`                | `^0.3.0`    | `^0.4.3`    |
	| `@rollup/plugin-typescript`              | `^11.0.0`   | `^11.1.2`   |
	| `globby`                                 | `^13.1.3`   | `^13.2.2`   |
	| ⭐ `magic-string`                         | N/A         | `^0.30.1`   |
	| `pathe`                                  | `^1.1.0`    | `^1.1.1`    |
	| ⚠️ `rimraf`                               | `^4.0.7`    | `^5.0.1`    |
	| `rollup`                                 | `^3.10.0`   | `^3.26.2`   |
	| `tslib`                                  | `^2.4.1`    | `^2.6.0`    |
	| ⚠️ `typescript`                           | `^5.1.6`    | `^4.9.4`    |

	New dependencies are marked with the "⭐" emoji.

	Dependencies with major version change are marked with the "⚠️" emoji.

	Removed dependencies are marked with the "☠️" emoji.

### Removed
* [#276]: **BREAKING CHANGE**: outputting CJS bundles; now only the ESM one is produced.

### Fixed
* [#300]: incorrect linking to other bundles in `.d.ts` files.

## [0.20.0] – 2023-07-13
### Added
* [#264]: support for bundling `.d.cts` and `.d.mts` type declaration files.
* [#265]: official support for non-standard dist directories.
* [#271]: support for [import assertions](https://v8.dev/features/import-assertions) syntax to enable importing JSON files in the pure ESM packages.
* [#278]: official support for Node.js 20.

### Changed
* [#233]: **BREAKING CHANGE**: package is a pure ESM one now.
* [#266]: **BREAKING CHANGE**: remove warning for skipping a CJS build.
* [#264]: updated the `rollup-plugin-dts` dependency from `^5.1.1` to `^5.3.0`.
* [#265]: added docs around import suggestions in VSC.

### Removed
* [#249]: **BREAKING CHANGE**: CJS bundle.

### Fixed
* [#277]: incorrect file permissions for bundled executables.

## [0.19.1] – 2023-02-25
### Fixed
* [#267]: the `@babel/preset-env` dependency was incorrectly marked as the dev one instead of production one.
* [#268]: the `package.json` file contained the incorrect path to the `rlb` executable.

## [0.19.0] – 2023-02-23
### Added
* [#116]: support for bundling binaries based on the `bin` field from the `package.json` file.

### Changed
* [#230]: **BREAKING CHANGE**: bundler now omits bundling files that are marked in `package.json` as bundle entrypoints; such files will be always treated as external and imported.
* [#243]: **BREAKING CHANGE**: bundler of type definitions loads now the `tsconfig.json` file of the project being bundled.
* [#247]: **BREAKING CHANGE**: the bundler's `package.json` contains now only the `exports`-based entrypoints.
* [#248]: **BREAKING CHANGE**: bundler of type definitions uses now virtual filesystem instead of a real temporary directory.
* **BREAKING CHANGE**: the list of dependencies changed:

	| Dependency                           | Added/Removed | Old version | New version |
	| ------------------------------------ | ------------- | ----------- | ----------- |
	| `@babel/plugin-transform-typescript` | Added         | N/A         | `^7.20.13`  |
	| `@babel/types`                       | Added         | N/A         | `^7.20.7`   |
	| `@rollup/plugin-virtual`             | Added         | N/A         | `^3.0.1`    |
	| `rollup-plugin-preseve-shebang`      | Added         | N/A         | `^1.0.1`    |
	| `tempy`                              | Removed       | `^3.0.0`    | N/A         |

* [#235]: binary now uses the ESM version of the bundler.

### Fixed
* [#255]: `.ts` source files were not transpiled by Babel to syntax understandable by specified Node.js version (v16.0.0 at the moment of fixing).

## [0.18.0] – 2023-02-05
### Changed
* [#209]: **BREAKING CHANGE**: parsing the project's `package.json` is no longer blocking as all file operations were rewritten to be asynchronous.

### Removed
* [#228]: **BREAKING CHANGE**: support for non-`exports` entrypoints.

### Fixed
* [#240]: bundling types incorrectly removes bundled types definitions right after creating them.
* [#242]: bundling of types creates incorrect file structure in `dist/` if source files are inside subdirectories.

## [0.17.0] – 2023-01-22
### Added
* [#220]: Support for bundling TypeScript projects.

### Changed
* [#225]: **BREAKING CHANGE**: Update dependencies, including major versions:
	* `@rollup/plugin-babel` – `5.3.1` → `^6.0.3`;
	* `@rollup/plugin-commonjs` – `22.0.2` → `^24.0.0`;
	* `@rollup/plugin-json` – `4.1.0` → `^6.0.0`;
	* `rimraf` – `3.0.2` → `^4.0.7`;
	* `rollup` – `2.79.1` → `^3.10.0`;
	* `rollup-plugin-terser` → `@rollup/plugin-terser`.

## [0.16.1] – 2022-11-10
### Fixed
* [#222]: dynamic external imports aren't preserved.

## [0.16.0] – 2022-05-08
### Added
* [#214]: Support for Node 18.
### Changed
* [#216]: **BREAKING CHANGE**: update dependencies including major versions of:
	* `@rollup/plugin-commonjs` from 21.x to `^22.0.0`.
* [#215]: make CJS builds optional.
### Removed
* [#214]: **BREAKING CHANGE**: support for Node 12 and 14.

## [0.15.1] – 2022-03-07
### Fixed
* [#212]: `rimraf` is incorrectly marked as a dev dependency instead of a production one.

## [0.15.0] – 2022-03-07
### Added
* [#204]: **BREAKING CHANGE**: clearing the `dist/` directory before bundling.
* [#185]: Support for subpath exports.
### Changed
* [#199]: **BREAKING CHANGE**: update dependencies including major versions of:
	* `@rollup/plugin-commonjs` from 19.x to `^21.0.0`.
* [#202]: spinner provided by `gauge` is replaced by `@comandeer/cli-spinner`.
### Fixed
* [#208]: warnings are logged to the `stdout` instead of `stderr`.

## [0.14.0] – 2021-07-21
### Added
* [#189]: Support for Node 16.
* [#156]: User-friendly error handling.
### Changed
* [#197]: **BREAKING CHANGE**: public API has changed to be always asynchronous.
* [#191]: **BREAKING CHANGE**: update `@rollup/plugin-commonjs` from `^18.0.0` to `^19.0.1` and other dependencies.
* [#193]: New, better output.

## [0.13.0] – 2021-05-03
### Added
* [#61]: Support for native ESM via [`exports` field](https://nodejs.org/api/packages.html#packages_exports) in a `package.json` file.
### Removed
* [#179] **BREAKING CHANGE**: support for Node 10.

## [0.12.0] – 2020-10-17
### Changed
* [#176] Update dependencies, including major versions:
	* `@rollup/plugin-commonjs` – 11.1.0 → 15.1.0;
	* `rollup-plugin-terser` – 5.3.0 → 7.0.2;
	* `mocha` – 7.1.2 → 8.2.0 (dev).

## [0.11.0] – 2020-05-10
### Added
* [#155] Support for importing JSON files. Thanks to [Piotr Kowalski](https://github.com/piecioshka)!
* [#171] Support for Node 14.

### Changed
* [#173] `rollup-plugin-babel` and `rollup-plugin-commonjs` dependencies are now `@rollup/plugin-babel` and `@rollup/plugin-commonjs` ones.

### Fixed
* [#168] Executable file has 644 mode. Thanks to [Piotr Kowalski](https://github.com/piecioshka)!

## [0.10.0] – 2020-04-11
### Changed
* [#163] **BREAKING CHANGE**: switch from `babel-minify` to `terser`.

### Removed
* [#162] **BREAKING CHANGE**: support for Node 8.
* [#164] **BREAKING CHANGE**: named exports from the package.


## [0.9.0] – 2019-06-30
### Added
* [#129] Support for Node 12.
* [#128] Official support for Windows and macOS.

### Removed
* [#129] **BREAKING CHANGE**: support for Node 6.

## [0.8.0] – 2019-01-20
### Changed
* [#110] **BREAKING CHANGE:** Update `rollup` to `^1.1.0`.
* [#111] Update `rollup-plugin-babel-minify` to `^7.0.0`.

## [0.7.1] – 2018-10-07
### Fixed
* [#105] Incorrect sourcemaps for bundles.

## [0.7.0] – 2018-08-29
### Added
* [#71] Add support for Babel 7.

### Remove
* [#71] **BREAKING CHANGE**: remove support for Babel < 7.

## [0.6.0] – 2018-05-20
### Changed
* [#83] **BREAKING CHANGE**: update `rollup-plugin-babel-minify` to version `^5.0.0`.

## [0.5.0] – 2018-05-01
### Added
* [#80] Add support for Node 10.

### Changed
* [#67] **BREAKING CHANGE**: CJS bundle is also transpiled.
* [#68] **BREAKING CHANGE**: update `@comandeer/babel-preset-rollup` to version `^2.0.0`.
* [#74] **BREAKING CHANGE**: rename keys returned by `packageParser`:
	* `dist.es5` → `dist.cjs`,
	* `dist.es2015` → `dist.esm`.

### Removed
* [#62] [#80] **BREAKING CHANGE**: remove support for Node <6, 7, 9.

## [0.4.2] – 2018-02-11
### Fixed
* [#58] Usage of deprecated Rollup config options.

## [0.4.1] – 2018-02-11
### Added
* [#54] Add `babel-core` as dependency.

## [0.4.0] – 2018-02-03
### Changed
* [#48] BREAKING CHANGE: add new line after the banner comment.

### Fixed
* [#49] Fix incorrect version of package in banner comment.

## [0.3.0] – 2017-09-16
### Changed
* [#30] BREAKING CHANGE: force Babel to ignore `.babelrc` file.
* [#16] Update rollup to `^0.50.0`.
* [`b36613d`] Update other dependencies.

## [0.2.0] – 2017-09-03
### Changed
* [#17] Switch from `rollup-plugin-babili` to `rollup-plugin-babel-minify`.
* [#21] Update rollup to `^0.49.2`.
* [#17] Remove rollup-plugin-uglify in favor of rollup-plugin-babel-minify.
* [#18] Replace babel-preset-es2015-rollup with dedicated evergreen @comandeer/babel-preset-rollup.

## [0.1.2] – 2017-06-17
### Fixed
* [#6] Fix incorrect parsing of author's metadata.

## [0.1.1] – 2017-03-19
### Added
* [`ba9197f`] Add this changelog.
* [`cbd2b2e`] Add proper README.

## 0.1.0 – 2017-03-19
### Added
* First working version, yay!

[`b36613d`]: https://github.com/Comandeer/rollup-lib-bundler/commit/b36613d6936e9c5ffa851ad89fac2c8892ecea72
[`ba9197f`]: https://github.com/Comandeer/rollup-lib-bundler/commit/ba9197f074f051f6aa0f116cb5fb8e199b80133d
[`cbd2b2e`]: https://github.com/Comandeer/rollup-lib-bundler/commit/cbd2b2ef760226b7f87cb338878a581910249bb0
[#6]: https://github.com/Comandeer/rollup-lib-bundler/issues/6
[#16]: https://github.com/Comandeer/rollup-lib-bundler/pull/16
[#17]: https://github.com/Comandeer/rollup-lib-bundler/issues/17
[#18]: https://github.com/Comandeer/rollup-lib-bundler/issues/18
[#21]: https://github.com/Comandeer/rollup-lib-bundler/pull/21
[#30]: https://github.com/Comandeer/rollup-lib-bundler/issues/30
[#48]: https://github.com/Comandeer/rollup-lib-bundler/issues/48
[#49]: https://github.com/Comandeer/rollup-lib-bundler/issues/49
[#54]: https://github.com/Comandeer/rollup-lib-bundler/issues/54
[#58]: https://github.com/Comandeer/rollup-lib-bundler/issues/58
[#61]: https://github.com/Comandeer/rollup-lib-bundler/issues/61
[#62]: https://github.com/Comandeer/rollup-lib-bundler/issues/62
[#67]: https://github.com/Comandeer/rollup-lib-bundler/issues/67
[#68]: https://github.com/Comandeer/rollup-lib-bundler/pull/68
[#71]: https://github.com/Comandeer/rollup-lib-bundler/issues/71
[#74]: https://github.com/Comandeer/rollup-lib-bundler/issues/74
[#80]: https://github.com/Comandeer/rollup-lib-bundler/issues/80
[#83]: https://github.com/Comandeer/rollup-lib-bundler/pull/83
[#105]: https://github.com/Comandeer/rollup-lib-bundler/issues/105
[#110]: https://github.com/Comandeer/rollup-lib-bundler/pull/110
[#111]: https://github.com/Comandeer/rollup-lib-bundler/pull/111
[#116]: https://github.com/Comandeer/rollup-lib-bundler/issues/116
[#129]: https://github.com/Comandeer/rollup-lib-bundler/issues/129
[#128]: https://github.com/Comandeer/rollup-lib-bundler/issues/128
[#155]: https://github.com/Comandeer/rollup-lib-bundler/issues/155
[#156]: https://github.com/Comandeer/rollup-lib-bundler/issues/156
[#162]: https://github.com/Comandeer/rollup-lib-bundler/issues/162
[#163]: https://github.com/Comandeer/rollup-lib-bundler/issues/163
[#164]: https://github.com/Comandeer/rollup-lib-bundler/issues/164
[#168]: https://github.com/Comandeer/rollup-lib-bundler/issues/168
[#171]: https://github.com/Comandeer/rollup-lib-bundler/issues/171
[#173]: https://github.com/Comandeer/rollup-lib-bundler/issues/173
[#176]: https://github.com/Comandeer/rollup-lib-bundler/issues/176
[#179]: https://github.com/Comandeer/rollup-lib-bundler/issues/179
[#185]: https://github.com/Comandeer/rollup-lib-bundler/issues/185
[#189]: https://github.com/Comandeer/rollup-lib-bundler/issues/189
[#191]: https://github.com/Comandeer/rollup-lib-bundler/issues/191
[#193]: https://github.com/Comandeer/rollup-lib-bundler/issues/193
[#197]: https://github.com/Comandeer/rollup-lib-bundler/issues/197
[#199]: https://github.com/Comandeer/rollup-lib-bundler/issues/199
[#202]: https://github.com/Comandeer/rollup-lib-bundler/issues/202
[#204]: https://github.com/Comandeer/rollup-lib-bundler/issues/204
[#208]: https://github.com/Comandeer/rollup-lib-bundler/issues/208
[#209]: https://github.com/Comandeer/rollup-lib-bundler/issues/209
[#212]: https://github.com/Comandeer/rollup-lib-bundler/issues/212
[#214]: https://github.com/Comandeer/rollup-lib-bundler/issues/214
[#215]: https://github.com/Comandeer/rollup-lib-bundler/issues/215
[#216]: https://github.com/Comandeer/rollup-lib-bundler/issues/216
[#220]: https://github.com/Comandeer/rollup-lib-bundler/issues/220
[#222]: https://github.com/Comandeer/rollup-lib-bundler/issues/222
[#225]: https://github.com/Comandeer/rollup-lib-bundler/issues/225
[#228]: https://github.com/Comandeer/rollup-lib-bundler/issues/228
[#230]: https://github.com/Comandeer/rollup-lib-bundler/issues/230
[#232]: https://github.com/Comandeer/rollup-lib-bundler/issues/232
[#233]: https://github.com/Comandeer/rollup-lib-bundler/issues/233
[#235]: https://github.com/Comandeer/rollup-lib-bundler/issues/235
[#240]: https://github.com/Comandeer/rollup-lib-bundler/issues/240
[#242]: https://github.com/Comandeer/rollup-lib-bundler/issues/242
[#243]: https://github.com/Comandeer/rollup-lib-bundler/issues/243
[#247]: https://github.com/Comandeer/rollup-lib-bundler/issues/247
[#248]: https://github.com/Comandeer/rollup-lib-bundler/issues/248
[#249]: https://github.com/Comandeer/rollup-lib-bundler/issues/249
[#255]: https://github.com/Comandeer/rollup-lib-bundler/issues/255
[#264]: https://github.com/Comandeer/rollup-lib-bundler/issues/264
[#265]: https://github.com/Comandeer/rollup-lib-bundler/issues/265
[#266]: https://github.com/Comandeer/rollup-lib-bundler/issues/266
[#267]: https://github.com/Comandeer/rollup-lib-bundler/issues/267
[#268]: https://github.com/Comandeer/rollup-lib-bundler/issues/268
[#271]: https://github.com/Comandeer/rollup-lib-bundler/issues/271
[#276]: https://github.com/Comandeer/rollup-lib-bundler/issues/276
[#277]: https://github.com/Comandeer/rollup-lib-bundler/issues/277
[#278]: https://github.com/Comandeer/rollup-lib-bundler/issues/278
[#279]: https://github.com/Comandeer/rollup-lib-bundler/issues/279
[#300]: https://github.com/Comandeer/rollup-lib-bundler/issues/300
[#303]: https://github.com/Comandeer/rollup-lib-bundler/issues/303
[#306]: https://github.com/Comandeer/rollup-lib-bundler/issues/306
[#311]: https://github.com/Comandeer/rollup-lib-bundler/issues/311
[#314]: https://github.com/Comandeer/rollup-lib-bundler/issues/314
[#321]: https://github.com/Comandeer/rollup-lib-bundler/issues/321


[0.24.0]: https://github.com/Comandeer/rollup-lib-bundler/compare/v0.23.0...v0.24.0
[0.23.0]: https://github.com/Comandeer/rollup-lib-bundler/compare/v0.22.1...v0.23.0
[0.22.1]: https://github.com/Comandeer/rollup-lib-bundler/compare/v0.22.0...v0.22.1
[0.22.0]: https://github.com/Comandeer/rollup-lib-bundler/compare/v0.21.0...v0.22.0
[0.21.0]: https://github.com/Comandeer/rollup-lib-bundler/compare/v0.20.0...v0.21.0
[0.20.0]: https://github.com/Comandeer/rollup-lib-bundler/compare/v0.19.0...v0.20.0
[0.19.1]: https://github.com/Comandeer/rollup-lib-bundler/compare/v0.19.0...v0.19.1
[0.19.0]: https://github.com/Comandeer/rollup-lib-bundler/compare/v0.18.0...v0.19.0
[0.18.0]: https://github.com/Comandeer/rollup-lib-bundler/compare/v0.17.0...v0.18.0
[0.17.0]: https://github.com/Comandeer/rollup-lib-bundler/compare/v0.16.1...v0.17.0
[0.16.1]: https://github.com/Comandeer/rollup-lib-bundler/compare/v0.16.0...v0.16.1
[0.16.0]: https://github.com/Comandeer/rollup-lib-bundler/compare/v0.15.1...v0.16.0
[0.15.1]: https://github.com/Comandeer/rollup-lib-bundler/compare/v0.15.0...v0.15.1
[0.15.0]: https://github.com/Comandeer/rollup-lib-bundler/compare/v0.14.0...v0.15.0
[0.14.0]: https://github.com/Comandeer/rollup-lib-bundler/compare/v0.13.0...v0.14.0
[0.13.0]: https://github.com/Comandeer/rollup-lib-bundler/compare/v0.12.0...v0.13.0
[0.12.0]: https://github.com/Comandeer/rollup-lib-bundler/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/Comandeer/rollup-lib-bundler/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/Comandeer/rollup-lib-bundler/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/Comandeer/rollup-lib-bundler/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/Comandeer/rollup-lib-bundler/compare/v0.7.1...v0.8.0
[0.7.1]: https://github.com/Comandeer/rollup-lib-bundler/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/Comandeer/rollup-lib-bundler/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/Comandeer/rollup-lib-bundler/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/Comandeer/rollup-lib-bundler/compare/v0.4.2...v0.5.0
[0.4.2]: https://github.com/Comandeer/rollup-lib-bundler/compare/v0.4.1...v0.4.2
[0.4.1]: https://github.com/Comandeer/rollup-lib-bundler/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/Comandeer/rollup-lib-bundler/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/Comandeer/rollup-lib-bundler/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Comandeer/rollup-lib-bundler/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/Comandeer/rollup-lib-bundler/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/Comandeer/rollup-lib-bundler/compare/v0.1.0...v0.1.1

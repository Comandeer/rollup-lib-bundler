# @comandeer/rollup-lib-bundler Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

---

## [0.15.0]
### Added
* [#204]: **BREAKING CHANGE**: clearing the `dist/` directory before bundling.
* [#185]: Support for subpath exports.
### Changed
* [#199]: **BREAKING CHANGE**: update dependencies including major versions of:
	* `@rollup/plugin-commonjs` from 19.x to `^21.0.0`.
* [#202]: spinner provided by `gauge` is replaced by `@comandeer/cli-spinner`.

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

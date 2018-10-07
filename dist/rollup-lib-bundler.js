/*! @comandeer/rollup-lib-bundler v0.7.1 | (c) 2018 Comandeer | MIT license (see LICENSE) */
"use strict";Object.defineProperty(exports,"__esModule",{value:!0});function _interopDefault(a){return a&&"object"==typeof a&&"default"in a?a["default"]:a}var fs=require("fs"),rollup=require("rollup"),convertCJS=_interopDefault(require("rollup-plugin-commonjs")),minify=_interopDefault(require("rollup-plugin-babel-minify")),babel=_interopDefault(require("rollup-plugin-babel")),preset=_interopDefault(require("@comandeer/babel-preset-rollup"));function generateBanner(a){return`/*! ${a.name} v${a.version} | (c) ${new Date().getFullYear()} ${a.author} | ${a.license} license (see LICENSE) */`}function loadAndParseFile(a){if(!fs.existsSync(a))throw new ReferenceError("File with given path does not exist.");const b=fs.readFileSync(a);let c;try{c=JSON.parse(b)}catch(a){throw new SyntaxError("Given file is not parsable as a correct JSON.")}return c}function lintObject(a){function b(b){if("undefined"==typeof a[b])throw new ReferenceError(`Package metadata must contain "${b}" property.`)}b("name"),b("version"),b("main"),function(b,c){if("undefined"==typeof a[b]&&"undefined"==typeof a[c])throw new ReferenceError(`Package metadata must contain either "${b}" or "${c}" or both properties.`)}("module","jsnext:main"),b("author"),b("license")}function prepareAuthorMetadata(a){return"object"==typeof a?a.name:a+""}function prepareMetadata(a){return{name:a.name,version:a.version,author:prepareAuthorMetadata(a.author),license:a.license,src:"src/index.js",dist:{esm:a.module||a["jsnext:main"],cjs:a.main}}}function packageParser(a){if("string"==typeof a)a=loadAndParseFile(a);else if("object"!=typeof a)throw new TypeError("Provide string or object.");return lintObject(a),prepareMetadata(a)}function getRollupConfig(a,b){const c=generateBanner(a),d=[convertCJS(),babel({babelrc:!1,presets:[[preset]]}),minify({comments:!1,banner:c,bannerNewLine:!0})];return{input:a.src,plugins:d,output:{banner:c,sourcemap:!0,format:b?"cjs":"es",file:b?a.dist.cjs:a.dist.esm}}}function bundler(a){const b=getRollupConfig(a,!0),c=getRollupConfig(a,!1);return Promise.all([rollup.rollup(b),rollup.rollup(c)]).then(a=>Promise.all([a[0].write(b.output),a[1].write(c.output)]))}function rlb(){const a=packageParser("package.json");return bundler(a)}exports.default=rlb,exports.bundler=bundler,exports.packageParser=packageParser,exports.generateBanner=generateBanner;
//# sourceMappingURL=rollup-lib-bundler.js.map

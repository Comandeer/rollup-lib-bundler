/*! @comandeer/rollup-lib-bundler v0.25.0 | (c) 2024 Comandeer | MIT license (see LICENSE) */
import{rimraf as t}from"rimraf";import e from"chalk";import n from"@babel/plugin-syntax-import-assertions";import r from"@babel/preset-env";import o from"@rollup/plugin-babel";import i from"@rollup/plugin-commonjs";import s from"@rollup/plugin-json";import a from"@rollup/plugin-terser";import c from"@rollup/plugin-typescript";import{rollup as p}from"rollup";import u from"rollup-plugin-preserve-shebang";import l from"@rollup/plugin-virtual";import{globby as f}from"globby";import{extname as d,dirname as m,join as g,resolve as y,relative as h,normalize as w}from"pathe";import b from"rollup-plugin-dts";import v from"typescript";import j from"magic-string";import{chmod as x,access as $,readFile as E}from"node:fs/promises";import{Console as W}from"node:console";import{stdout as k,stderr as S}from"node:process";import _ from"@comandeer/cli-spinner";import C from"semver";import F from"node:assert/strict";const P="\0virtual:",O=new RegExp(`^${P}`);function L(t,e,{isTypeBundling:n=!1}={}){return{name:"rlb-resolve-other-bundles",async resolveId(r,o){if(!r.startsWith(".")||"string"!=typeof o)return null;const i=n?function(t,e){const n=d(t),r=n.replace(/js$/,"ts"),o=new RegExp(`${n}$`),i=t.replace(o,`${r}`),s=t.replace(o,`.d${r}`),a=e.replace(O,""),c=m(a),p=g(c,s),u=g(c,i);return{id:`${P}${p}`,tsSourceFilePath:u}}(r,o):await this.resolve(r,o,{skipSelf:!0}),s=function(t,e,n){if(n&&"tsSourceFilePath"in e)return e.tsSourceFilePath;return h(t,e.id)}(t,i,n),a=function(t,e,n){const r=e[t],o=void 0!==r;if(!n)return o;return o&&void 0!==r.types}(s,e,n);if(!a)return n?i.id:null;return{id:`rlb:${s}`,external:!0}},async renderChunk(n,r,{file:o}){const i=y(t,o),s=new j(n);s.replaceAll(/(?:import|export).+?from\s*["'](rlb:.+?)["']/g,((n,r)=>{const o=function(e,n,r){const o=e.slice(4),i=n[o].esm,s=y(t,i),a=m(r),c=h(a,s);return c.startsWith(".")?c:`./${c}`}(r,e,i);return n.replace(r,o)}));return{code:s.toString(),map:s.generateMap()}}}}async function R({packageMetadata:t,sourceFile:e,outputFile:n,tsConfig:r,onWarn:o=(()=>{})}){const i=t.project,s=function(t,e){if(void 0===e)return{};const n=y(t,e),r=v.readConfigFile(n,v.sys.readFile);return v.parseJsonConfigFileContent(r.config,v.sys,t).options}(i,r),a={...s,declaration:!0,emitDeclarationOnly:!0};delete a.outDir,delete a.declarationDir,delete a.outFile,delete a.rootDir;const c=await f("src/**/*.{cts,mts,ts}",{absolute:!0,cwd:i}),u={},d=v.createCompilerHost(a);d.writeFile=(t,e)=>{const n=D(i,t);u[n]=e};v.createProgram(c,a,d).emit();const m=function(t,e){const n=/\.(c|m)?ts$/,r=D(t,e).replace(n,".d.$1ts");return r}(i,e),g={input:m,plugins:[l(u),L(i,t.dist,{isTypeBundling:!0}),b()],onwarn:o},h={file:n,format:"es"},w=await p(g);await w.write(h)}function D(t,e){return e.replace(t,"").replace(/^[/\\]/,"")}async function T({onWarn:t,packageMetadata:e}){await Promise.all(function(t,e=(()=>{})){const l=Object.entries(t.dist);return l.map((([l,f])=>async function(t,e,l,{onWarn:f=(()=>{})}={}){const d=(b=t,`/*! ${b.name} v${b.version} | (c) ${(new Date).getFullYear()} ${b.author} | ${b.license} license (see LICENSE) */`),g=function(t,e,p,l=(()=>{})){const f=[i(),s(),L(t.project,t.dist),{name:"rlb-preserve-dynamic-imports",renderDynamicImport:()=>({left:"import(",right:");"})},o({babelrc:!1,babelHelpers:"bundled",plugins:[n],presets:[[r,{targets:{node:t.targets.node}}]],extensions:[".js",".mjs",".cjs",".ts",".mts",".cts"]}),u(),a()];if("ts"===p.type){const t=function({esm:t,tsConfig:e}){const n={tsconfig:e??!1,declaration:!1};void 0!==e&&(n.compilerOptions={outDir:m(t)});return n}(p);f.splice(3,0,c(t))}return{input:e,onwarn:l,plugins:f}}(t,e,l,f),h=function(t,e){return{banner:e,sourcemap:!0,format:"esm",file:t,exports:"auto"}}(l.esm,d),w=await p(g);var b;await w.write(h),l.isBin&&await async function(t,{esm:e}){const n=y(t,e);return x(n,"755")}(t.project,l);void 0!==l.types&&await R({packageMetadata:t,sourceFile:e,outputFile:l.types,tsConfig:l.tsConfig,onWarn:f})}(t,l,f,{onWarn:e})))}(e,t))}class B{#t;#e;#n;#r;constructor({console:t=new W({stdout:k,stderr:S}),spinner:e=new _({label:"Working…",stdout:S})}={}){if(!(null!==(n=t)&&"object"==typeof n&&"log"in n&&"warn"in n&&"error"in n))throw new TypeError("Custom console must be a valid Console object");var n;if(!function(t){return null!==t&&"object"==typeof t&&"show"in t&&"hide"in t}(e))throw new TypeError("Custom spinner must be a valid spinner object");this.#t=t,this.#e=e,this.#n=[],this.#r=[]}static createWarning(t){return"object"==typeof t&&void 0!==t.message&&(t=t.message),e.yellow.bold(`⚠️ Warning!⚠️ ${t}`)}static createError({name:t,message:n,stack:r}){const o=r?.split("\n")??[];o.shift();const i=o.join("\n");return`${e.red.bold(`🚨Error🚨\n${t}: ${n}`)}\n${i}`}async showSpinner(){return this.#e.show()}async hideSpinner(){return this.#e.hide()}addLog(...t){this.#n.push(t)}addWarning(t){if("object"==typeof(e=t)&&"UNRESOLVED_IMPORT"===e.code)return;var e;const n=B.createWarning(t);this.#r.push([n])}async display(){await this.hideSpinner(),this.#r.forEach((t=>{this.#t.warn(...t)})),this.#n.forEach((t=>{this.#t.log(...t)}))}async displayError(t){await this.hideSpinner();const e=B.createError(t);this.#t.error(e)}}async function M(t){const e=y(t,"package.json");try{await $(e)}catch{throw new ReferenceError("The package.json does not exist in the provided location.")}const n=await E(e,"utf8");let r;try{r=JSON.parse(n)}catch{throw new SyntaxError("The package.json file is not parsable as a correct JSON.")}return function(t){if(void 0===t.name)throw new ReferenceError('Package metadata must contain "name" property.');if(void 0===t.version)throw new ReferenceError('Package metadata must contain "version" property.');if(void 0===t.exports||"string"!=typeof t.exports&&"string"!=typeof t.exports["."]&&!("import"in t.exports)&&void 0===t.exports["."]?.import)throw new ReferenceError('Package metadata must contain at least one of "exports[ \'.\' ].import" and "exports.import" properties or the "exports" property must contain the path.');if(void 0===t.author)throw new ReferenceError('Package metadata must contain "author" property.');if(void 0===t.license)throw new ReferenceError('Package metadata must contain "license" property.')}(r),r}async function I(t,e){const n=[...N(e),...J(e)],r=await Promise.all(n.map((n=>async function(t,e,n){const r=await async function(t,e){const n=y(t,"src"),r="."===e?"index":e,o=`${r}.{mts,ts,mjs,js,cts,cjs}`,i=await f(o,{cwd:n});return function(t){const e=[".mts",".ts",".mjs",".js",".cts",".cjs"],n=t.sort(((t,n)=>e.indexOf(d(t))-e.indexOf(d(n))));return F(void 0!==n[0],"At least one entrypoint exists"),n[0]}(i)}(t,n),o=g("src",r),i=function(t){return t.startsWith("./__bin__")}(n),s=i?function({bin:t,name:e},n){const r=/^\.\/__bin__\//g,o=n.replace(r,"");if(F(void 0!==t,"Bin metadata is specified"),o===e&&"string"==typeof t)return t;return t[o]}(e,n):function({exports:t},e){if("string"==typeof t)return t;if("string"==typeof t[e])return t[e];if(void 0===t[e]&&"."===e&&"import"in t)return t.import;return t[e].import}(e,n),a=function(t){const e=d(t).toLowerCase().endsWith("ts");return e?"ts":"js"}(o),c={esm:s,type:a,isBin:i};if("ts"===a){const r=function({exports:t},e){if("string"==typeof t||"string"==typeof t[e])return;if(void 0===t[e]&&"."===e&&"types"in t)return t.types;if(void 0!==t[e])return t[e].types;return}(e,n),o=await async function(t){const e="tsconfig?(.rlb).json",n=await f(e,{cwd:t});if(0===n.length)return;const r=n.find((t=>t.endsWith(".rlb.json")))??n[0];return r}(t);void 0!==r&&(c.types=r),void 0!==o&&(c.tsConfig=o)}return{[o]:c}}(t,e,n))));return[...r].reduce(((t,e)=>({...t,...e})),{})}function N(t){const e=t.exports;if("string"==typeof e)return["."];const n=Object.keys(e).filter((t=>t.startsWith(".")));return n.includes(".")||n.unshift("."),n}function J({bin:t,name:e}){if(void 0===t)return[];if("string"==typeof t)return[`./__bin__/${e}`];return Object.keys(t).map((t=>`./__bin__/${t}`))}async function A(t){if("string"!=typeof t)throw new TypeError("Provide a path to a package directory.");return async function(t,e){const n=w(t);return{project:n,name:e.name,version:e.version,author:H(e.author),license:e.license,dist:await I(t,e),targets:{node:V(e)}}}(t,await M(t))}function H(t){return"object"!=typeof t?String(t):t.name}function V({engines:t}){if(void 0===t?.node)return"current";try{const e=C.minVersion(t.node)?.version;return e??"current"}catch{return"current"}}async function U(){const n=new B;try{await n.showSpinner();const r=process.cwd(),o=await A(r),i=function({project:t,dist:e}){const n=new Set;return Object.values(e).forEach((({esm:e,types:r})=>{const o=y(t,e),i=m(o);if(n.add(i),void 0!==r){const e=y(t,r),o=m(e);n.add(o)}})),[...n]}(o).filter((t=>t!==o.project));await t(i),await T({onWarn(t){n.addWarning(t)},packageMetadata:o}),n.addLog(e.green.bold("Bundling complete!"))}catch(t){await n.displayError(t),n.addLog(e.red.bold("Bundling failed!"))}finally{await n.display()}}export{U as default};
//# sourceMappingURL=rollup-lib-bundler.mjs.map

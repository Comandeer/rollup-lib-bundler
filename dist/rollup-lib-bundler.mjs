/*! @comandeer/rollup-lib-bundler v0.23.0 | (c) 2024 Comandeer | MIT license (see LICENSE) */
import{rimraf as n}from"rimraf";import t from"chalk";import e from"@babel/plugin-syntax-import-assertions";import r from"@babel/preset-env";import o from"@rollup/plugin-babel";import i from"@rollup/plugin-commonjs";import s from"@rollup/plugin-json";import a from"@rollup/plugin-terser";import c from"@rollup/plugin-typescript";import{rollup as p}from"rollup";import l from"rollup-plugin-preserve-shebang";import u from"@rollup/plugin-virtual";import{globby as f}from"globby";import{extname as d,dirname as m,join as g,resolve as h,relative as w,normalize as y}from"pathe";import b from"rollup-plugin-dts";import v from"typescript";import j from"magic-string";import{chmod as $,readFile as E,access as W}from"node:fs/promises";import{fileURLToPath as k}from"node:url";import{Console as x}from"node:console";import{stdout as S,stderr as _}from"node:process";import C from"@comandeer/cli-spinner";const F="\0virtual:",P=new RegExp(`^${F}`);function O(n,t,{isTypeBundling:e=!1}={}){return{name:"rlb-resolve-other-bundles",async resolveId(r,o){if(!r.startsWith(".")||"string"!=typeof o)return null;const i=e?function(n,t){const e=d(n),r=e.replace(/js$/,"ts"),o=new RegExp(`${e}$`),i=n.replace(o,`${r}`),s=n.replace(o,`.d${r}`),a=t.replace(P,""),c=m(a),p=g(c,s),l=g(c,i);return{id:`${F}${p}`,tsSourceFilePath:l}}(r,o):await this.resolve(r,o,{skipSelf:!0}),s=function(n,t,e){if(e&&"tsSourceFilePath"in t)return t.tsSourceFilePath;return w(n,t.id)}(n,i,e),a=function(n,t,e){const r=t[n],o=void 0!==r;if(!e)return o;return o&&void 0!==r.types}(s,t,e);if(!a)return e?i.id:null;return{id:`rlb:${s}`,external:!0}},async renderChunk(e,r,{file:o}){const i=h(n,o),s=new j(e);s.replaceAll(/(?:import|export).+?from\s*["'](rlb:.+?)["']/g,((e,r)=>{const o=function(t,e,r){const o=t.slice(4),i=e[o].esm,s=h(n,i),a=m(r),c=w(a,s);return c.startsWith(".")?c:`./${c}`}(r,t,i);return e.replace(r,o)}));return{code:s.toString(),map:s.generateMap()}}}}async function L({packageInfo:n,sourceFile:t,outputFile:e,tsConfig:r,onWarn:o=(()=>{})}){const i=n.project,s=function(n,t){if(void 0===t)return{};const e=h(n,t),r=v.readConfigFile(e,v.sys.readFile);return v.parseJsonConfigFileContent(r.config,v.sys,n).options}(i,r),a={...s,declaration:!0,emitDeclarationOnly:!0};delete a.outDir,delete a.declarationDir,delete a.outFile,delete a.rootDir;const c=await f("src/**/*.{cts,mts,ts}",{absolute:!0,cwd:i}),l={},d=v.createCompilerHost(a);d.writeFile=(n,t)=>{const e=R(i,n);l[e]=t};v.createProgram(c,a,d).emit();const m=function(n,t){const e=/\.(c|m)?ts$/,r=R(n,t).replace(e,".d.$1ts");return r}(i,t),g={input:m,plugins:[u(l),O(i,n.dist,{isTypeBundling:!0}),b()],onwarn:o},w={file:e,format:"es"},y=await p(g);await y.write(w)}function R(n,t){return t.replace(n,"").replace(/^[/\\]/,"")}const I=(T=import.meta.url,m(k(T)));var T;const D=h(I,"..","package.json"),B=await E(D,"utf8"),{engines:N}=JSON.parse(B),J=N.node.replace(/[<=>~^]/g,"");async function H({onWarn:n,packageInfo:t}){await Promise.all(function(n,t=(()=>{})){const u=Object.entries(n.dist);return u.map((([u,f])=>async function(n,t,u,{onWarn:f=(()=>{})}={}){const d=(y=n,`/*! ${y.name} v${y.version} | (c) ${(new Date).getFullYear()} ${y.author} | ${y.license} license (see LICENSE) */`),m=function(n,t,p,u=(()=>{})){const f=[i(),s(),O(n.project,n.dist),{name:"rlb-preserve-dynamic-imports",renderDynamicImport:()=>({left:"import(",right:");"})},o({babelrc:!1,babelHelpers:"bundled",plugins:[e],presets:[[r,{targets:{node:J}}]],extensions:[".js",".mjs",".cjs",".ts",".mts",".cts"]}),l(),a()];"ts"===p.type&&f.splice(3,0,c({tsconfig:p.tsConfig??!1,declaration:!1}));return{input:t,onwarn:u,plugins:f}}(n,t,u,f),g=function(n,t){return{banner:t,sourcemap:!0,format:"esm",file:n,exports:"auto"}}(u.esm,d),w=await p(m);var y;await w.write(g),u.isBin&&await async function(n,{esm:t}){const e=h(n,t);return $(e,"755")}(n.project,u);void 0!==u.types&&await L({packageInfo:n,sourceFile:t,outputFile:u.types,tsConfig:u.tsConfig,onWarn:f})}(n,u,f,{onWarn:t})))}(t,n))}class M{#n;#t;#e;#r;constructor({console:n=new x({stdout:S,stderr:_}),spinner:t=new C({label:"Working…",stdout:_})}={}){if(!(null!==(e=n)&&"object"==typeof e&&"log"in e&&"warn"in e&&"error"in e))throw new TypeError("Custom console must be a valid Console object");var e;if(!function(n){return null!==n&&"object"==typeof n&&"show"in n&&"hide"in n}(t))throw new TypeError("Custom spinner must be a valid spinner object");this.#n=n,this.#t=t,this.#e=[],this.#r=[]}static createWarning(n){return"object"==typeof n&&void 0!==n.message&&(n=n.message),t.yellow.bold(`⚠️ Warning!⚠️ ${n}`)}static createError({name:n,message:e,stack:r}){const o=(null==r?void 0:r.split("\n"))??[];o.shift();const i=o.join("\n");return`${t.red.bold(`🚨Error🚨\n${n}: ${e}`)}\n${i}`}async showSpinner(){return this.#t.show()}async hideSpinner(){return this.#t.hide()}addLog(...n){this.#e.push(n)}addWarning(n){if("object"==typeof(t=n)&&"UNRESOLVED_IMPORT"===t.code)return;var t;const e=M.createWarning(n);this.#r.push([e])}display(){this.#r.forEach((n=>{this.#n.warn(...n)})),this.#e.forEach((n=>{this.#n.log(...n)}))}displayError(n){const t=M.createError(n);this.#n.error(t)}}async function A(n){if("string"!=typeof n)throw new TypeError("Provide a path to a package directory.");const t=await async function(n){const t=g(n,"package.json");try{await W(t)}catch{throw new ReferenceError("The package.json does not exist in the provided location.")}const e=await E(t,"utf8");let r;try{r=JSON.parse(e)}catch(n){throw new SyntaxError("The package.json file is not parsable as a correct JSON.")}return r}(n);return function(n){var t,e;if(void 0===n.name)throw new ReferenceError('Package metadata must contain "name" property.');if(void 0===n.version)throw new ReferenceError('Package metadata must contain "version" property.');if(void 0===(null===(t=n.exports)||void 0===t?void 0:t.import)&&void 0===(null===(e=n.exports)||void 0===e||null===(e=e["."])||void 0===e?void 0:e.import))throw new ReferenceError('Package metadata must contain one of "exports[ \'.\' ].import" or "exports.import" properties or all of them.');if(void 0===n.author)throw new ReferenceError('Package metadata must contain "author" property.');if(void 0===n.license)throw new ReferenceError('Package metadata must contain "license" property.')}(t),async function(n,t){const e=y(n);return{project:e,name:t.name,version:t.version,author:U(t.author),license:t.license,dist:await V(n,t)}}(n,t)}function U(n){return"object"!=typeof n?String(n):n.name}async function V(n,t){const e=function(n){const t=n.exports,e=Object.keys(t).filter((n=>n.startsWith(".")));e.includes(".")||e.unshift(".");const r=function({bin:n,name:t}){if(void 0===n)return[];if("string"==typeof n)return[`./__bin__/${t}`];const e=Object.keys(n).map((n=>`./__bin__/${n}`));return e}(n);return e.push(...r),e}(t),r=await Promise.all(e.map((e=>async function(n,t,e){const r=await async function(n,t){const e=g(n,"src"),r="."===t?"index":t,o=`${r}.{mts,ts,mjs,js,cts,cjs}`,i=await f(o,{cwd:e});return function(n){const t=[".mts",".ts",".mjs",".js",".cts",".cjs"],e=n.sort(((n,e)=>t.indexOf(d(n))-t.indexOf(d(e))));return e[0]}(i)}(n,e),o=g("src",r),i=function(n){return n.startsWith("./__bin__")}(e),s=i?function({bin:n,name:t},e){const r=/^\.\/__bin__\//g,o=e.replace(r,"");if(o===t&&"string"==typeof n)return n;return n[o]}(t,e):function(n,t){const e=Y(n,t,"import");return e}(t,e),a=function(n){const t=n.toLowerCase().endsWith("ts");return t?"ts":"js"}(o),c={esm:s,type:a,isBin:i};if("ts"===a){const r=function(n,t){const e=Y(n,t,"types");return e}(t,e),o=await async function(n){const t="tsconfig?(.rlb).json",e=await f(t,{cwd:n});if(0===e.length)return;const r=e.find((n=>n.endsWith(".rlb.json")))??e[0];return r}(n);r&&(c.types=r),void 0!==o&&(c.tsConfig=o)}return{[o]:c}}(n,t,e))));return[...r].reduce(((n,t)=>({...n,...t})),{})}function Y(n,t,e){const r=n.exports;return void 0!==r[t]?r[t][e]:void 0===r[t]&&"."===t?r[e]:void 0}async function q(){const e=new M;try{await e.showSpinner();const r=process.cwd(),o=await A(r),i=function({project:n,dist:t}){const e=new Set;return Object.values(t).forEach((({esm:t,types:r})=>{const o=h(n,t),i=m(o);if(e.add(i),void 0!==r){const t=h(n,r),o=m(t);e.add(o)}})),[...e]}(o).filter((n=>n!==o.project));await n(i),await H({onWarn(n){e.addWarning(n)},packageInfo:o}),e.addLog(t.green.bold("Bundling complete!"))}catch(n){e.displayError(n),e.addLog(t.red.bold("Bundling failed!"))}finally{await e.hideSpinner(),e.display()}}export{q as default};
//# sourceMappingURL=rollup-lib-bundler.mjs.map

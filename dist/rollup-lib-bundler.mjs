/*! @comandeer/rollup-lib-bundler v0.19.0 | (c) 2023 Comandeer | MIT license (see LICENSE) */
import{join as t,normalize as e,extname as r,dirname as n,relative as o,resolve as i}from"pathe";import{rimraf as s}from"rimraf";import a from"console-control-strings";import{Console as c}from"node:console";import{Writable as l,Duplex as u}from"node:stream";import p from"@comandeer/cli-spinner";import{access as f,readFile as d}from"node:fs/promises";import{rollup as m}from"rollup";import g from"@rollup/plugin-commonjs";import h from"@rollup/plugin-terser";import w from"@rollup/plugin-json";import y from"@rollup/plugin-babel";import b from"@babel/preset-env";import v from"rollup-plugin-preserve-shebang";import j from"@rollup/plugin-typescript";import W from"rollup-plugin-dts";import $ from"@rollup/plugin-virtual";import x from"typescript";import{transformAsync as E}from"@babel/core";import*as k from"@babel/types";const C=Symbol("stdout"),S=Symbol("stderr"),_=Symbol("spinner");class L{constructor({stdout:t=process.stdout,stderr:e=process.stderr}={}){if(!D(t))throw new TypeError("Custom stdout must be a valid writable/duplex stream");if(!D(e))throw new TypeError("Custom stderr must be a valid writable/duplex stream");this[C]=t,this[S]=e,this.console=new c({stdout:t,stderr:e}),this[_]=new p({label:"Working…",stdout:e}),this.pendingLogs=[],this.pendingWarnings=[]}async showSpinner(){return this[_].show()}async hideSpinner(){return this[_].hide()}addLog(...t){this.pendingLogs.push(t)}addWarning(t){if((e=t)&&"object"==typeof e&&"UNRESOLVED_IMPORT"===e.code)return;var e;const r=function(t){t&&"object"==typeof t&&t.message&&(t=t.message);return`${a.color(["yellow","bold"])}⚠️ Warning!⚠️ ${t}${a.color("reset")}`}(t);this.pendingWarnings.push([r])}display(){this.pendingWarnings.forEach((t=>{this.console.warn(...t)})),this.pendingLogs.forEach((t=>{this.console.log(...t)}))}displayError(t){const e=function({name:t,message:e,stack:r}){const n=r.split("\n");n.shift();const o=n.join("\n");return`${a.color(["bold","red"])}🚨Error🚨\n${t}: ${e}${a.color("reset")}\n${o}`}(t);this.console.error(e)}}function D(t){return t instanceof l||t instanceof u}let I,O;async function P(r){if("string"!=typeof r)throw new TypeError("Provide a path to a package directory.");const n=await async function(e){const r=t(e,"package.json");try{await f(r)}catch{throw new ReferenceError("The package.json does not exist in the provided location.")}const n=await d(r,"utf8");let o;try{o=JSON.parse(n)}catch(t){throw new SyntaxError("The package.json file is not parsable as a correct JSON.")}return o}(r);return function(t){var e,r,n;if(void 0===t.name)throw new ReferenceError('Package metadata must contain "name" property.');if(void 0===t.version)throw new ReferenceError('Package metadata must contain "version" property.');if(void 0===(null===(e=t.exports)||void 0===e?void 0:e.import)&&void 0===(null===(r=t.exports)||void 0===r||null===(n=r["."])||void 0===n?void 0:n.import))throw new ReferenceError('Package metadata must contain one of "exports[ \'.\' ].import" or "exports.import" properties or all of them.');if(void 0===t.author)throw new ReferenceError('Package metadata must contain "author" property.');if(void 0===t.license)throw new ReferenceError('Package metadata must contain "license" property.')}(n),async function(t,r){const n=e(t);return{project:n,name:r.name,version:r.version,author:F(r.author),license:r.license,dist:await R(t,r)}}(r,n)}function F(t){return"object"!=typeof t?String(t):t.name}async function R(e,n){const o=function(t){const e=t.exports,r=Object.keys(e).filter((t=>t.startsWith(".")));r.includes(".")||r.unshift(".");const n=function({bin:t,name:e}){if(void 0===t)return[];if("string"==typeof t)return[`./__bin__/${e}`];const r=Object.keys(t).map((t=>`./__bin__/${t}`));return r}(t);return r.push(...n),r}(n),i=await Promise.all(o.map((o=>async function(e,n,o){const i=await async function(e,n){if(!I){const t=await import("globby");I=t.globby}const o=t(e,"src"),i="."===n?"index":n,s=`${i}.{mts,ts,mjs,js,cts,cjs}`,a=await I(s,{cwd:o});return function(t){const e=[".mts",".ts",".mjs",".js",".cts",".cjs"],n=t.sort(((t,n)=>e.indexOf(r(t))-e.indexOf(r(n))));return n[0]}(a)}(e,o),s=t("src",i),a=function(t){return t.startsWith("./__bin__")}(o)?function({bin:t,name:e},r){const n=/^\.\/__bin__\//g,o=r.replace(n,"");if(o===e&&"string"==typeof t)return t;return t[o]}(n,o):function(t,e){const r=N(t,e,"import");return r}(n,o),c=function(t,e){const r=N(t,e,"require");return r}(n,o),l=function(t){const e=t.toLowerCase().endsWith("ts");return e?"ts":"js"}(s),u={esm:a,type:l};c&&(u.cjs=c);if("ts"===l){const t=function(t,e){const r=N(t,e,"types");return r}(n,o),r=await async function(t){const e="tsconfig?(.rlb).json",r=await I(e,{cwd:t});if(0===r.length)return null;const n=r.find((t=>t.endsWith(".rlb.json")))||r[0];return n}(e);t&&(u.types=t),r&&(u.tsConfig=r)}return{[s]:u}}(e,n,o))));return[...i].reduce(((t,e)=>({...t,...e})),{})}function N(t,e,r){const n=t.exports;return n[e]?n[e][r]:n[e]||"."!==e?void 0:n[r]}function T(e){const r="\0virtual:src";return{resolveId(i,s){var a;if(!s)return null;const c=n(s),l=/\.(m|c)?js$/,u=(null===(a=i.match(l))||void 0===a?void 0:a[0])??"";i.endsWith(".d.ts")||(i=`${i.replace(l,"")}.d.ts`);const p=t(c,i),f=p.replace(r,"./dist"),d=function(t,e){return Object.entries(t).some((([,{types:t}])=>t===e))}(e,f);if(!d)return p;const m=s.replace(r,"./dist"),g=n(m);return{id:`./${o(g,f).replace(/\.d\.ts$/,u)}`,external:!0}}}}async function J({packageInfo:t,sourceFile:e,outputFile:r,tsConfig:n,onWarn:o=(()=>{})}={}){if(!O){const t=await import("globby");O=t.globby}const s=t.project,a=function(t,e){if(!e)return{};const r=i(t,e),n=x.readConfigFile(r,x.sys.readFile),o=x.parseJsonConfigFileContent(n.config,x.sys,t);return o.options}(s,n),c={...a,declaration:!0,emitDeclarationOnly:!0};delete c.outDir,delete c.declarationDir,delete c.outFile,delete c.rootDir;const l=await O("src/**/*.ts",{absolute:!0,cwd:s}),u={},p=x.createCompilerHost(c);p.writeFile=(t,e)=>{const r=q(s,t);u[r]=e};x.createProgram(l,c,p).emit();const f=function(t,e){const r=q(t,e).replace(/\.ts$/,".d.ts");return r}(s,e),d={input:f,plugins:[T(t.dist),$(u),W()],onwarn:o},g={file:r,format:"es"},h=await m(d);await h.write(g)}function q(t,e){return e.replace(t,"").replace(/^[/\\]/,"")}function A(t,e){return{name:"rlb-resolve-other-bundles",async resolveId(r,n){if(!r.startsWith("."))return null;const i=(await this.resolve(r,n,{skipSelf:!0})).id,s=o(t,i);if(!(void 0!==e[s]))return null;return{id:`rlb:${s}`,external:!0}},async renderChunk(r,n,{file:o}){const s=i(t,o),{code:a,map:c}=await E(r,{plugins:[B(t,e,s)]});return{code:a,map:c}}}}function B(t,e,r){return{visitor:{ImportDeclaration(t){const{node:e}=t,{value:r}=e.source;if(!r.startsWith("rlb:"))return;const n=s(r,"esm");t.replaceWith(k.importDeclaration(e.specifiers,k.stringLiteral(n)))},ExportNamedDeclaration(t){const{node:e}=t,{source:r}=e;if(!r||!r.value.startsWith("rlb:"))return;const n=s(r.value,"esm");t.replaceWith(k.exportNamedDeclaration(e.declaration,e.specifiers,k.stringLiteral(n)))},ExportAllDeclaration(t){const{node:e}=t,{source:r}=e;if(!r.value.startsWith("rlb:"))return;const n=s(r.value,"esm");t.replaceWith(k.exportAllDeclaration(k.stringLiteral(n)))},CallExpression(t){const{node:e}=t,{callee:r,arguments:n}=e;if(!k.isIdentifier(r)||"require"!==r.name)return;const[o]=n;if(!k.isStringLiteral(o))return;const i=o.value;if(!i.startsWith("rlb:"))return;const a=s(i,"cjs");t.replaceWith(k.callExpression(k.identifier("require"),[k.stringLiteral(a)]))}}};function s(s,a){const c=s.slice(4),l=e[c][a],u=i(t,l),p=n(r),f=o(p,u);return f.startsWith(".")?f:`./${f}`}}const H=">=16.0.0".replace(/[<=>~^]/g,"");async function M({onWarn:t,packageInfo:e}){await Promise.all(function(t,e=(()=>{})){const r=Object.entries(t.dist);return r.map((([r,n])=>async function(t,e,r,{onWarn:n=(()=>{})}={}){const o=(l=t,`/*! ${l.name} v${l.version} | (c) ${(new Date).getFullYear()} ${l.author} | ${l.license} license (see LICENSE) */`),i=function(t,e,r,n=(()=>{})){const o=[g(),w(),A(t.project,t.dist),{renderDynamicImport:()=>({left:"import(",right:");"})},y({babelrc:!1,babelHelpers:"bundled",presets:[[b,{targets:{node:H}}]],extensions:[".js",".mjs",".cjs",".ts",".mts",".cts"]}),v(),h()];"ts"===r.type&&o.splice(3,0,j({tsconfig:!!r.tsConfig&&r.tsConfig,declaration:!1}));return{input:e,onwarn:n,plugins:o}}(t,e,r,n),s=U(r.esm,o,"esm"),a=await m(i),c=[a.write(s)];var l;if(r.cjs){const t=U(r.cjs,o,"cjs");c.push(a.write(t))}else n(`Skipping CJS build for ${e}`);await Promise.all(c),r.types&&await J({packageInfo:t,sourceFile:e,outputFile:r.types,tsConfig:r.tsConfig,onWarn:n})}(t,r,n,{onWarn:e})))}(e,t))}function U(t,e,r="esm"){return{banner:e,sourcemap:!0,format:r,file:t,exports:"auto"}}async function V(){const t=new L;try{await t.showSpinner();const e=process.cwd(),r=i(e,"dist");await s(r);const n=await P(e);await M({onWarn(e){t.addWarning(e)},packageInfo:n}),t.addLog(`${a.color(["bold","green"])}Bundling complete!${a.color("reset")}`)}catch(e){t.displayError(e),t.addLog(`${a.color(["bold","red"])}Bundling failed!${a.color("reset")}`)}finally{await t.hideSpinner(),t.display()}}export{V as default};
//# sourceMappingURL=rollup-lib-bundler.mjs.map

import { rollup } from 'rollup';
import convertCJS from 'rollup-plugin-commonjs';
import minify from 'rollup-plugin-babel-minify';
import babel from 'rollup-plugin-babel';
import preset from 'babel-preset-es2015-rollup';
import uglify from 'rollup-plugin-uglify';

function getRollupConfig( metadata, isEs5 ) {
	const banner = `/*! ${metadata.name} v${metadata.version} | (c) ${new Date().getFullYear()} ${metadata.author} | ${metadata.license} license (see LICENSE) */`;
	const plugins = [
		convertCJS(),
		minify( {
			comments: false,
			banner
		} )
	];

	if ( isEs5 ) {
		plugins[ 1 ] = babel( {
			presets: [
				[ preset ]
			]
		} );

		plugins.push( uglify( {
			output: {
				preamble: banner
			}
		} ) );
	}

	return {
		input: metadata.src,
		plugins,
		banner,
		output: {
			sourcemap: true,
			format: isEs5 ? 'cjs' : 'es',
			file: isEs5 ? metadata.dist.es5 : metadata.dist.es2015
		}
	};
}

function bundler( metadata ) {
	const configEs5 = getRollupConfig( metadata, true );
	const configEs2015 = getRollupConfig( metadata, false );

	return Promise.all( [
		rollup( configEs5 ),
		rollup( configEs2015 )
	] ).then( ( bundles ) => {
		return Promise.all( [
			bundles[ 0 ].write( configEs5.output ),
			bundles[ 1 ].write( configEs2015.output )
		] );
	} );
}

export default bundler;

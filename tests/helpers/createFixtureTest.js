import { existsSync } from 'fs';
import { expect } from 'chai';

function createFixtureTest( { expected = [], cmd = async () => {} } = {} ) {
	return async () => {
		await cmd();

		checkFiles( expected );
	};
}

function checkFiles( files ) {
	files.forEach( ( file ) => {
		expect( existsSync( file ) ).to.equal( true );
	} );
}

export default createFixtureTest;

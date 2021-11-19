function deepClone( obj ) {
	if ( typeof obj !== 'object' || !obj ) {
		return obj;
	}

	if ( Array.isArray( obj ) ) {
		return [ ...obj ];
	}

	return Object.entries( obj ).reduce( ( newObj, [ name, value ] ) => {
		const newValue = value && typeof value === 'object' ? deepClone( value ) : value;
		const propertyObject = {
			[ name ]: newValue
		};

		return { ...newObj, ...propertyObject };
	}, {} );
}

export { deepClone };

'use strict';
const Nameplate = require('../classes/nameplate');

const nameplates = [
	new Nameplate(0, 'left'),
	new Nameplate(1, 'right'),
	new Nameplate(2, 'left'),
	new Nameplate(3, 'right')
];

// Start disabled
nameplates.forEach(nameplate => nameplate.disable());

/**
 * Shallowly extends an object. Overwrites existing properties.
 * @param {Object} obj - The base object to extend.
 * @param {Object} ext - The object to merge into the base.
 * @returns {Object} - A reference to obj.
 */
function extend(obj, ext) {
	for (const key in ext) {
		if (ext.hasOwnProperty(key)) {
			obj[key] = ext[key];
		}
	}
	return obj;
}

module.exports = {
	disable() {
		nameplates.forEach(nameplate => nameplate.disable());
	},

	enable() {
		nameplates.forEach(nameplate => nameplate.enable());
	},

	configure(globalOpts, perNameplateOpts) {
		const numNameplates = perNameplateOpts.length;

		// Enable/disable nameplates as appropriate.
		nameplates.forEach((nameplate, index) => {
			if (index <= numNameplates - 1) {
				const opts = extend(perNameplateOpts[index], globalOpts);
				nameplate.enable();
				nameplate.configure(opts);
			} else {
				nameplate.disable();
			}
		});
	}
};

'use strict';
const CompactNameplate = require('../classes/compact_nameplate');

const compactNameplates = [
	new CompactNameplate(0, 'left'),
	new CompactNameplate(1, 'right'),
	new CompactNameplate(2, 'left'),
	new CompactNameplate(3, 'right')
];

// Start disabled
compactNameplates.forEach(nameplate => nameplate.disable());

module.exports = {
	disable() {
		compactNameplates.forEach(nameplate => nameplate.disable());
	},

	enable() {
		compactNameplates.forEach(nameplate => nameplate.enable());
	},

	configure(arrayOfOpts) {
		arrayOfOpts = arrayOfOpts || [];
		const numNameplates = arrayOfOpts.length;

		// Enable/disable nameplates as appropriate.
		compactNameplates.forEach((nameplate, index) => {
			if (index <= numNameplates - 1) {
				nameplate.enable();
				nameplate.configure(arrayOfOpts[index]);
			} else {
				nameplate.disable();
			}
		});
	}
};


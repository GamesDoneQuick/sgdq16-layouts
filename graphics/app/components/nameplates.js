/* global define */
define([
	'globals',
	'classes/nameplate'
], (globals, Nameplate) => {
	'use strict';

	const nameplates = [
		new Nameplate(0, 'left'),
		new Nameplate(1, 'right'),
		new Nameplate(2, 'left'),
		new Nameplate(3, 'right')
	];

	// Start disabled
	nameplates.forEach(nameplate => nameplate.disable());

	function extend(obj, src) {
		for (const key in src) {
			if (src.hasOwnProperty(key)) {
				obj[key] = src[key];
			}
		}
		return obj;
	}

	return {
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
});

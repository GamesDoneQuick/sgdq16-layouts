/* global define */
define(() => {
	'use strict';

	const ret = {
		log() {
			if (nodecg.bundleConfig.debug) {
				console.debug.apply(console, arguments);
			}
		},
		time() {
			if (nodecg.bundleConfig.debug) {
				console.time.apply(console, arguments);
			}
		},
		timeEnd() {
			if (nodecg.bundleConfig.debug) {
				console.timeEnd.apply(console, arguments);
			}
		}
	};

	window.debug = ret;

	return ret;
});

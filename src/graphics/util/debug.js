'use strict';

module.exports = {
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

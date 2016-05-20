'use strict';

const fs = require('fs');
const format = require('util').format;

module.exports = function (nodecg) {
	const currentRun = nodecg.Replicant('currentRun');
	nodecg.listenFor('logAdPlay', ad => {
		const logStr = format('%s, %s, %s, %s\n',
			new Date().toISOString(), ad.filename, currentRun.value.name, currentRun.value.concatenatedRunners);

		fs.appendFile('logs/ad_log.csv', logStr, err => {
			if (err) {
				nodecg.log.error('[advertisements] Error appending to log:', err.stack);
			}
		});
	});

	nodecg.Replicant('ftb', {defaultValue: false});
};

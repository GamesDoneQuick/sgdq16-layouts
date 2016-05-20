'use strict';

const singleInstance = require('../../../lib/graphics/single_instance');

module.exports = function (nodecg) {
	const adState = nodecg.Replicant('adState', {defaultValue: 'stopped', persistent: false});
	const layoutState = nodecg.Replicant('layoutState', {
		defaultValue: {
			currentLayout: null,
			page: 'closed'
		},
		persistent: false
	});

	singleInstance.on('graphicAvailable', url => {
		if (url === `/graphics/${nodecg.bundleName}/index.html`) {
			layoutState.value.page = 'closed';
			layoutState.value.currentLayout = null;
			adState.value = 'stopped';
		}
	});
};

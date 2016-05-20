'use strict';

const debug = require('../util/debug');
const loader = require('../util/loader');
const containerEl = document.getElementById('container');
let lastBg;

module.exports = function (bgName) {
	debug.log('[background] setBackground(%s)', bgName);

	// Remove the last background, if any.
	if (lastBg) {
		lastBg.remove();
	}

	const newBg = loader.queue.getResult(`bg-${bgName}`);
	newBg.id = 'background';
	containerEl.appendChild(newBg);
	lastBg = newBg;
};

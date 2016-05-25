'use strict';

const debug = require('../util/debug');
const loader = require('../util/loader');
const containerEl = document.getElementById('container');

module.exports = function (bgName) {
	debug.log('[background] setBackground(%s)', bgName);

	const background = loader.queue.getResult(`bg-${bgName}`);
	background.id = 'background';
	containerEl.appendChild(background);

	const foreground = loader.queue.getResult(`fg-${bgName}`);
	foreground.id = 'foreground';
	containerEl.appendChild(foreground);
};

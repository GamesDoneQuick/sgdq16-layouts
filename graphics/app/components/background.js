/* global define */
define([
	'debug',
	'preloader'
], (debug, preloader) => {
	'use strict';

	const containerEl = document.getElementById('container');
	let lastBg;

	return function (bgName) {
		debug.log('[background] setBackground(%s)', bgName);

		// Remove the last background, if any.
		if (lastBg) {
			lastBg.remove();
		}

		const newBg = preloader.getResult(`bg-${bgName}`);
		newBg.id = 'background';
		containerEl.appendChild(newBg);
		lastBg = newBg;
	};
});

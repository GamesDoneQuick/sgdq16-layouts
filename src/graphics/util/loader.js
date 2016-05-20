'use strict';

const Promise = require('bluebird');
const debug = require('./debug');
const globals = require('./globals');
const queue = new createjs.LoadQueue();
let preloaderDone = false;
let replicantsDone = false;

module.exports.queue = queue;

/**
 * Loads assets.
 * @param {String} layoutName - The name of the layout to load.
 * @param {Object} [opts] - Options which alter loading.
 * @returns {Promise} - A promise that is resolved once everything is fully loaded.
 */
module.exports.load = function (layoutName, opts = {}) {
	if (typeof opts.gameplay === 'undefined') {
		opts.gameplay = true;
	}

	if (typeof opts.omnibar === 'undefined') {
		opts.omnibar = true;
	}

	// RAF_SYNCHED tends to look best in OBS Studio.
	// This may change in future versions of OBS Studio.
	createjs.Ticker.timingMode = createjs.Ticker.RAF_SYNCHED;
	createjs.Ticker.framerate = 60;

	// Preload images
	const manifest = [{id: `bg-${layoutName}`, src: `img/backgrounds/${layoutName}.png`}];

	if (opts.gameplay) {
		manifest.push(
			{id: 'console-3ds', src: 'img/consoles/3ds.png'},
			{id: 'console-arc', src: 'img/consoles/arc.png'},
			{id: 'console-dc', src: 'img/consoles/dc.png'},
			{id: 'console-ds', src: 'img/consoles/ds.png'},
			{id: 'console-gb', src: 'img/consoles/gb.png'},
			{id: 'console-gba', src: 'img/consoles/gba.png'},
			{id: 'console-gbc', src: 'img/consoles/gbc.png'},
			{id: 'console-gcn', src: 'img/consoles/gcn.png'},
			{id: 'console-gen', src: 'img/consoles/gen.png'},
			{id: 'console-n64', src: 'img/consoles/n64.png'},
			{id: 'console-nes', src: 'img/consoles/nes.png'},
			{id: 'console-pc', src: 'img/consoles/pc.png'},
			{id: 'console-ps1', src: 'img/consoles/ps1.png'},
			{id: 'console-ps2', src: 'img/consoles/ps2.png'},
			{id: 'console-ps3', src: 'img/consoles/ps3.png'},
			{id: 'console-ps4', src: 'img/consoles/ps4.png'},
			{id: 'console-psp', src: 'img/consoles/psp.png'},
			{id: 'console-sat', src: 'img/consoles/sat.png'},
			{id: 'console-snes', src: 'img/consoles/snes.png'},
			{id: 'console-wii', src: 'img/consoles/wii.png'},
			{id: 'console-wiiu', src: 'img/consoles/wiiu.png'},
			{id: 'console-wshp', src: 'img/consoles/wshp.png'},
			{id: 'console-xbox', src: 'img/consoles/xbox.png'},
			{id: 'console-x360', src: 'img/consoles/x360.png'},
			{id: 'console-xboxone', src: 'img/consoles/xboxone.png'},
			{id: 'console-unknown', src: 'img/consoles/unknown.png'},

			{id: 'nameplate-audio-on', src: 'img/nameplate/audio-on.png'},
			{id: 'nameplate-audio-off', src: 'img/nameplate/audio-off.png'},
			{id: 'nameplate-twitch-logo', src: 'img/nameplate/twitch-logo.png'}
		);
	}

	if (opts.omnibar) {
		manifest.push(
			{id: 'omnibar-logo-gdq', src: 'img/omnibar/logo-gdq.png'},
			{id: 'omnibar-logo-pcf', src: 'img/omnibar/logo-pcf.png'}
		);
	}

	queue.setMaxConnections(10);

	return new Promise(resolve => {
		queue.loadManifest(manifest);

		queue.on('complete', () => {
			queue.removeAllEventListeners('complete');
			preloaderDone = true;
			debug.log('preloading complete');
			checkReplicantsAndPreloader();
		});

		if (globals.replicantsDeclared) {
			replicantsDone = true;
			debug.log('replicants declared');
			checkReplicantsAndPreloader();
		} else {
			globals.once('replicantsDeclared', () => {
				replicantsDone = true;
				debug.log('replicants declared');
				checkReplicantsAndPreloader();
			});
		}

		/**
		 * Fades up the document body if the preload queue is complete && all replicants have been fully declared.
		 * @returns {undefined}
		 */
		function checkReplicantsAndPreloader() {
			if (!preloaderDone || !replicantsDone) {
				return;
			}

			resolve();

			// Fade up the body once everything is loaded
			TweenLite.to(document.body, 0.5, {
				delay: 0.2,
				opacity: 1,
				ease: Power1.easeInOut
			});
		}
	});
};

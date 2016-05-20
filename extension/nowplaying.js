'use strict';

const LastFmNode = require('lastfm').LastFmNode;

module.exports = function (nodecg) {
	if (Object.keys(nodecg.bundleConfig.lastfm).length === 0) {
		nodecg.log.error('"lastfm" is not defined in cfg/sgdq16-layouts.json! ' +
			'"Now playing" graphic will be disabled.');
		return;
	}

	/* eslint-disable camelcase */
	const lastfm = new LastFmNode({
		api_key: nodecg.bundleConfig.lastfm.apiKey,
		secret: nodecg.bundleConfig.lastfm.secret
	});
	const trackStream = lastfm.stream(nodecg.bundleConfig.lastfm.targetAccount);
	/* eslint-enable camelcase */

	const pulsing = nodecg.Replicant('nowPlayingPulsing', {defaultValue: false, persistent: false});
	const nowPlaying = nodecg.Replicant('nowPlaying', {defaultValue: {}, persistent: false});
	let pulseTimeout;

	nodecg.listenFor('pulseNowPlaying', pulse);

	trackStream.on('nowPlaying', track => {
		const newNp = {
			artist: track.artist['#text'],
			song: track.name,
			album: track.album['#text'] || track.artist['#text'],
			cover: track.image.pop()['#text'],
			artistSong: `${track.artist['#text']} - ${track.name}`
		};

		// As of 2015-11-22, Last.fm seems to sometimes send duplicate "nowPlaying" events.
		// This filters them out.
		if (typeof nowPlaying.value.artistSong === 'string') {
			if (newNp.artistSong.toLowerCase() === nowPlaying.value.artistSong.toLowerCase()) {
				return;
			}
		}

		nowPlaying.value = newNp;

		// If the graphic is already showing, end it prematurely and show the new song
		if (pulsing.value) {
			clearTimeout(pulseTimeout);
			pulsing.value = false;
		}

		// Show the graphic
		pulse();
	});

	trackStream.on('error', () => {
		// Just ignore it, this lib generates tons of errors.
	});

	trackStream.start();

	/**
	 * Shows the nowPlaying graphic for 12 seconds.
	 * @returns {undefined}
	 */
	function pulse() {
		// Don't stack pulses
		if (pulsing.value) {
			return;
		}

		pulsing.value = true;

		// Hard-coded 12 second duration
		pulseTimeout = setTimeout(() => {
			pulsing.value = false;
		}, 12 * 1000);
	}
};

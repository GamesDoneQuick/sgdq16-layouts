'use strict';

const SONG_EXTRA_WIDTH = 40;
const debug = require('../util/debug');

Polymer({
	is: 'now-playing',

	properties: {
		song: String,
		album: String
	},

	observers: [
		'_resizeContainers(song, album)'
	],

	ready() {
		const self = this;
		const tl = new TimelineLite({autoRemoveChildren: true});
		const nowPlaying = nodecg.Replicant('nowPlaying');

		const songContainer = this.$.songContainer;
		let songContainerWidth = 0;
		let songContainerX = '-100%';
		const songContainerProxy = {};
		Object.defineProperty(songContainerProxy, 'x', {
			set(newVal) {
				const percentage = parseFloat(newVal) / 100;
				songContainerX = newVal;
				TweenLite.set(songContainer, {
					x: Math.round(songContainerWidth * percentage)
				});
			},
			get() {
				return songContainerX;
			}
		});

		const albumContainer = this.$.albumContainer;
		let albumContainerWidth = 0;
		let albumContainerX = '-100%';
		const albumContainerProxy = {};
		Object.defineProperty(albumContainerProxy, 'x', {
			set(newVal) {
				const percentage = parseFloat(newVal) / 100;
				albumContainerX = newVal;
				TweenLite.set(albumContainer, {
					x: Math.round(albumContainerWidth * percentage)
				});
			},
			get() {
				return albumContainerX;
			}
		});

		nodecg.Replicant('nowPlayingPulsing').on('change', newVal => {
			if (newVal) {
				tl.call(() => {
					self.style.visibility = 'visible';

					self.song = nowPlaying.value.song;
					songContainerProxy.x = '-100%';

					self.album = nowPlaying.value.album;
					albumContainerProxy.x = '-100%';

					songContainerWidth = songContainer.getBoundingClientRect().width;
					albumContainerWidth = albumContainer.getBoundingClientRect().width;
				}, null, null, '+=0.1');

				tl.to([songContainerProxy, albumContainerProxy], 1.2, {
					onStart() {
						debug.time('nowPlayingEnter');
					},
					x: '0%',
					ease: Power2.easeOut,
					onComplete() {
						debug.timeEnd('nowPlayingEnter');
					}
				});
			} else {
				tl.to([songContainerProxy, albumContainerProxy], 1.2, {
					onStart() {
						debug.time('nowPlayingExit');
					},
					x: '-100%',
					ease: Power2.easeIn,
					onComplete() {
						self.style.visibility = 'hidden';
						debug.timeEnd('nowPlayingExit');
					}
				});
			}
		});
	},

	_resizeContainers() {
		this.$.songContainer.style.width = 'auto';

		const songContainerWidth = this.$.songContainer.getBoundingClientRect().width;
		const albumContainerWidth = this.$.albumContainer.getBoundingClientRect().width;
		if (songContainerWidth < albumContainerWidth + SONG_EXTRA_WIDTH) {
			this.$.songContainer.style.width = `${albumContainerWidth + SONG_EXTRA_WIDTH}px`;
		}
	}
});

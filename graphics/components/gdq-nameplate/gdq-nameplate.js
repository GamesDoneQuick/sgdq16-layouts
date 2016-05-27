(function () {
	'use strict';

	const currentRun = nodecg.Replicant('currentRun');
	const stopwatches = nodecg.Replicant('stopwatches');
	const gameAudioChannels = nodecg.Replicant('gameAudioChannels');

	Polymer({
		is: 'gdq-nameplate',

		properties: {
			index: Number,
			attachLeft: {
				type: Boolean,
				reflectToAttribute: true,
				observer: 'attachLeftChanged'
			},
			attachRight: {
				type: Boolean,
				reflectToAttribute: true,
				observer: 'attachRightChanged'
			},
			finished: {
				type: Boolean,
				reflectToAttribute: true,
				observer: 'finishedChanged'
			},
			stopped: {
				type: Boolean,
				reflectToAttribute: true,
				observer: 'stoppedChanged',
				value: false
			},
			time: String,
			place: Number,
			name: {
				type: String,
				value: ''
			},
			twitch: {
				type: String,
				value: ''
			}
		},

		observers: [
			'namesChanged(name, twitch)'
		],

		attachLeftChanged(newVal) {
			if (newVal && this.attachRight) {
				this.attachRight = false;
			}
		},

		attachRightChanged(newVal) {
			if (newVal && this.attachLeft) {
				this.attachLeft = false;
			}
		},

		finishedChanged(newVal) {
			if (newVal && this.stopped) {
				this.stopped = false;
			}
		},

		stoppedChanged(newVal) {
			if (newVal && this.finished) {
				this.finished = false;
			}
		},

		calcPlaceImage(newVal, stopped) {
			if (stopped) {
				return '';
			}

			switch (newVal) {
				case 1:
					return 'components/gdq-nameplate/img/finished-gold.png';
				case 2:
					return 'components/gdq-nameplate/img/finished-silver.png';
				case 3:
					return 'components/gdq-nameplate/img/finished-bronze.png';
				default:
					return '';
			}
		},

		namesChanged(name, twitch) {
			name = name.toUpperCase();
			twitch = twitch.toUpperCase();
			if (name === twitch) {

			}
		},

		ready() {
			/* currentRun.on('change', this.currentRunChanged.bind(this));
			 stopwatches.on('change', this.stopwatchesChanged.bind(this));
			 gameAudioChannels.on('change', this.gameAudioChannelsChanged.bind(this)); */
			/*this.tl = new TimelineMax({repeat: -1});
			this.tl.to(this.$.content)*/
		},

		/*
		 * 1) For singleplayer, if both match (ignoring capitalization), show only twitch.
		 * 2) For races, if everyone matches (ignoring capitalization), show only twitch, otherwise,
		 *    if even one person needs to show both, everyone shows both.
		 */
		currentRunChanged(newVal) {
			const canConflateAllRunners = newVal.runners.forEach(runner => {
				if (runner) {
					return runner.name.toLowerCase() === runner.stream.toLowerCase();
				}

				return true;
			});

			const runner = newVal.runners[this.index];
			if (runner) {
				this.name = runner.name;
				this.twitch = runner.stream;
			} else {
				this.name = '?';
				this.twitch = '';
			}

			/*if (stream) {
				this.restartTwitchTimeline();
			} else if (this.twitchTl) {
				this.twitchTl.kill();
				this.twitchContainer.visible = false;
			}*/
		},

		stopwatchesChanged(newVal) {
			const stopwatch = newVal[index];
			this.timeText.text = tabulate(stopwatch.time);

			this.timeText.color = 'white';
			this.estimateText.color = '#afe2f8';
			this.backgroundFill.style = '#00AEEF';

			switch (stopwatch.state) {
				case 'paused':
					this.timeText.color = '#007c9e';
					break;
				case 'finished':
					this.backgroundFill.style = '#60bb46';
					this.estimateText.color = '#b7dcaf';
					break;
				default:
				// Do nothing.
			}
		},

		gameAudioChannelsChanged(newVal) {
			if (!newVal || newVal.length <= 0) {
				return;
			}

			const channels = newVal[index];
			const canHearSd = !channels.sd.muted && !channels.sd.fadedBelowThreshold;
			const canHearHd = !channels.hd.muted && !channels.hd.fadedBelowThreshold;
			if (canHearSd || canHearHd) {
				if (!this.audioIcon.filters) {
					return;
				}

				this.audioIcon.filters = null;
				this.audioIcon.alpha = 1;
				this.audioIcon.image = loader.queue.getResult('nameplate-audio-on');
				this.audioIcon.uncache();
			} else {
				if (this.audioIcon.filters && this.audioIcon.filters.length > 0) {
					return;
				}

				this.audioIcon.image = loader.queue.getResult('nameplate-audio-off');
				this.audioIcon.filters = [this.audioIconColorFilter];
				this.audioIcon.alpha = 0.2;
				this.audioIcon.cache(0, 0, AUDIO_ICON_WIDTH, AUDIO_ICON_HEIGHT);
			}
		}
	});
})();
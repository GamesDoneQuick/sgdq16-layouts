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
			},
			timeTL: {
				type: TimelineLite,
				value() {
					return new TimelineLite({autoRemoveChildren: true});
				},
				readOnly: true
			}
		},

		observers: [
			'namesChanged(name, twitch)',
			'finishedOrStoppedChanged(finished, stopped)'
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
			if (newVal) {
				this.stopped = false;
			}
		},

		stoppedChanged(newVal) {
			if (newVal) {
				this.finished = false;
			}
		},

		finishedOrStoppedChanged(finished, stopped) {
			if (finished || stopped) {
				this.showTime();
			} else {
				this.hideTime();
			}
		},

		showTime() {
			if (this._timeShowing) {
				return;
			}

			this._timeShowing = true;

			this.timeTL.clear();
			this.timeTL.call(() => {
				this.$.timeShine.style.width = '140%';
				if (this.attachRight) {
					this.$.timeClip.style.webkitClipPath = 'polygon(0 0, 140% 0%, calc(140% - 15px) 100%, 0% 100%)';
				} else {
					this.$.timeClip.style.webkitClipPath = 'polygon(-40% 0, 100% 0, 100% 100%, calc(-40% + 15px) 100%)';
				}
			});

			this.timeTL.set(this.$.timeShine, {transition: 'none', width: 0}, '+=1');
			this.timeTL.set(this.$.medal, {zIndex: 1});
			this.timeTL.set(this.$.timeShine, {transition: 'width 400ms linear', width: '140%', opacity: 0.5});
			this.timeTL.set(this.$.medal, {className: '+=shine'}, '+=0.25');
			this.timeTL.set(this.$.medal, {className: '-=shine'}, '+=0.35');
		},

		hideTime() {
			if (!this._timeShowing) {
				return;
			}

			this._timeShowing = false;

			this.timeTL.clear();
			this.timeTL.set(this.$.medal, {clearProps: 'zIndex'});
			this.timeTL.set(this.$.timeShine, {width: 0, clearProps: 'opacity', transition: 'width 325ms ease-in'});
			this.timeTL.set(this.$.timeClip, {
				clearProps: 'webkitClipPath',
				transition: '-webkit-clip-path 325ms ease-in'
			});
		},

		calcMedalImage(newVal, stopped) {
			if (stopped) {
				return '';
			}

			switch (newVal) {
				case 1:
					return 'components/gdq-nameplate/img/medal-gold.png';
				case 2:
					return 'components/gdq-nameplate/img/medal-silver.png';
				case 3:
					return 'components/gdq-nameplate/img/medal-bronze.png';
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
			const stopwatch = newVal[this.index];
			this.timeText.text = stopwatch.time;

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

(function () {
	'use strict';

	const NAME_FADE_DURATION = 0.33;
	const NAME_FADE_IN_EASE = Power1.easeOut;
	const NAME_FADE_OUT_EASE = Power1.easeIn;
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
			this.nameTL = new TimelineMax({repeat: -1, paused: true});
			this.nameTL.to(this.$.names, NAME_FADE_DURATION, {
				onStart: function () {
					this.$.namesTwitch.style.display = 'block';
					this.$.namesName.style.display = 'none';
				}.bind(this),
				opacity: 1,
				ease: NAME_FADE_IN_EASE
			});
			this.nameTL.to(this.$.names, NAME_FADE_DURATION, {
				opacity: 0,
				ease: NAME_FADE_OUT_EASE
			}, '+=10');
			this.nameTL.to(this.$.names, NAME_FADE_DURATION, {
				onStart: function () {
					this.$.namesTwitch.style.display = 'none';
					this.$.namesName.style.display = 'block';
				}.bind(this),
				opacity: 1,
				ease: NAME_FADE_IN_EASE
			});
			this.nameTL.to(this.$.names, NAME_FADE_DURATION, {
				opacity: 0,
				ease: NAME_FADE_OUT_EASE
			}, '+=80');

			currentRun.on('change', this.currentRunChanged.bind(this));
			//stopwatches.on('change', this.stopwatchesChanged.bind(this));
			//gameAudioChannels.on('change', this.gameAudioChannelsChanged.bind(this));
		},

		/*
		 * 1) For singleplayer, if both match (ignoring capitalization), show only twitch.
		 * 2) For races, if everyone matches (ignoring capitalization), show only twitch, otherwise,
		 *    if even one person needs to show both, everyone shows both.
		 */
		currentRunChanged(newVal, oldVal) {
			console.log('currentRunChanged', newVal.runners);

			// If nothing has changed, do nothing.
			if (oldVal && JSON.stringify(newVal.runners) === JSON.stringify(oldVal.runners)) {
				return;
			}

			let canConflateAllRunners = true;
			newVal.runners.forEach(runner => {
				if (runner && runner.name.toLowerCase() !== runner.stream.toLowerCase()) {
					canConflateAllRunners = false;
				}
			});

			TweenLite.to(this.$.names, NAME_FADE_DURATION, {
				opacity: 0,
				ease: NAME_FADE_OUT_EASE,
				onComplete: function () {
					this.$.namesName.style.display = 'none';
					this.$.namesTwitch.style.display = 'block';

					const runner = newVal.runners[this.index];
					if (runner) {
						this.name = runner.name;
						this.twitch = runner.stream;
					} else {
						this.name = '?';
						this.twitch = '?';
					}

					if (canConflateAllRunners) {
						this.nameTL.pause();
						TweenLite.to(this.$.names, NAME_FADE_DURATION, {opacity: 1, ease: NAME_FADE_IN_EASE});
					} else {
						this.nameTL.restart();
					}
				}.bind(this)
			});
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

(function () {
	'use strict';

	const total = nodecg.Replicant('total');
	const currentRun = nodecg.Replicant('currentRun');
	const nextRun = nodecg.Replicant('nextRun');

	Polymer({
		is: 'gdq-omnibar',

		properties: {
			state: {
				type: Object,
				value() {
					return {
						totalShowing: true,
						labelShowing: true
					};
				}
			},
			lastShownGrandPrize: {
				type: Object
			}
		},

		ready() {
			this.tl = new TimelineLite({autoRemoveChildren: true});

			// Play the shine animation every 2 minutes.
			setInterval(() => {
				this.$.gdqLogo.play();
			}, 120 * 1000);

			this.$.totalText.rawValue = 0;
			total.on('change', this.totalChanged.bind(this));
		},

		totalChanged(newVal) {
			const TIME_PER_DOLLAR = 0.03;
			const delta = newVal.raw - this.$.totalText.rawValue;
			const duration = Math.min(delta * TIME_PER_DOLLAR, 5);
			let strLen = this.$.totalText.textContent.length;
			TweenLite.to(this.$.totalText, duration, {
				rawValue: newVal.raw,
				ease: Power2.easeOut,
				onUpdate: function () {
					this.$.totalText.textContent = this.$.totalText.rawValue.toLocaleString('en-US', {
						style: 'currency',
						currency: 'USD',
						maximumFractionDigits: 0
					});

					if (this.$.totalText.textContent.length !== strLen) {
						this.fitMainText();
						strLen = this.$.totalText.textContent.length;
					}
				}.bind(this)
			});
		},

		fitMainText() {
			const maxWidth = this.$.main.clientWidth;
			[this.$.mainLine1, this.$.mainLine2].forEach(element => {
				const elementWidth = element.clientWidth;
				if (elementWidth > maxWidth) {
					TweenLite.set(element, {scaleX: maxWidth / elementWidth});
				} else {
					TweenLite.set(element, {scaleX: 1});
				}
			});
		},

		/**
		 * Creates an animation timeline for showing the label.
		 * @param {String} text - The text to show.
		 * @param {String} size - The font size to use.
		 * @returns {TimelineLite} - An animation timeline.
		 */
		showLabel(text, size) {
			const tmpTL = new TimelineLite();
			if (this.state.labelShowing) {
				tmpTL.to(this.$.labelText, 0.25, {
					opacity: 0,
					ease: Power1.easeInOut,
					onComplete: function () {
						this.$.labelText.textContent = text;
						this.$.labelText.style.fontSize = size;
					}.bind(this)
				});

				tmpTL.to(this.$.labelText, 0.25, {
					opacity: 1,
					ease: Power1.easeInOut
				});
			} else {
				tmpTL.staggerTo([
					[this.$.labelRibbon3, this.$.labelShadow],
					this.$.labelRibbon2,
					this.$.labelRibbon1
				], 1.2, {
					onStart: function () {
						this.state.labelShowing = true;
						this.$.labelText.textContent = text;
						this.$.labelText.style.fontSize = size;
					}.bind(this),
					x: '0%',
					ease: Elastic.easeOut.config(0.5, 0.5)
				}, 0.08);

				tmpTL.to(this.$.labelText, 0.25, {
					opacity: 1,
					ease: Power1.easeInOut
				}, '-=0.4');
			}

			return tmpTL;
		},

		/**
		 * Creates an animation timeline for hiding the label.
		 * @returns {TimelineLite} - An animation timeline.
		 */
		hideLabel() {
			const tmpTL = new TimelineLite();

			if (this.state.labelShowing) {
				tmpTL.to(this.$.labelText, 0.25, {
					opacity: 0,
					ease: Power1.easeInOut
				});

				tmpTL.staggerTo([
					this.$.labelRibbon1,
					this.$.labelRibbon2,
					[this.$.labelRibbon3, this.$.labelShadow]
				], 0.7, {
					onStart: function () {
						this.state.labelShowing = false;
					}.bind(this),
					x: '-115%',
					ease: Back.easeIn.config(1.3)
				}, 0.08, '-=0.1');
			}

			return tmpTL;
		},

		/**
		 * Adds an animation to the global timeline for showing the next upcoming speedrun.
		 * @param {Boolean} [immediate] - If true, clears all pending animations and shows the next run immediately.
		 * @returns {undefined}
		 */
		showUpNext(immediate) {
			let upNextRun = nextRun.value;

			if (window.currentLayout === 'break' || window.currentLayout === 'interview') {
				upNextRun = currentRun.value;
			}

			if (upNextRun) {
				if (immediate) {
					this.tl.clear();
				}

				this.tl.to({}, 0.3, {
					onStart: this.showLabel,
					onStartParams: ['UP NEXT', '28px']
				});

				// GSAP is dumb with `call` sometimes. Putting this in a near-zero duration tween seems to be more reliable.
				this.tl.to({}, 0.01, {
					onComplete: function () {
						/* Depending on how we enter the very end of the schedule, we might end up in this func
						 * after window.nextRun has been set to null. In that case, we immediately clear the
						 * timeline and bail out to showing bids again.
						 */
						const upNextRun = window.currentLayout === 'break' ? globals.currentRun : globals.nextRun;
						if (upNextRun) {
							this.showMainLine1(upNextRun.concatenatedRunners);
							this.showMainLine2(`${upNextRun.name.replace('\\n', ' ').trim()} - ${upNextRun.category}`);
						} else {
							this.tl.clear();

							this.tl.to({}, 0.3, {
								onStart() {
									showMainLine1('');
									showMainLine2('');
								},
								onComplete: showCurrentBids
							});
						}
					}.bind(this)
				});

				// Give it some time to show
				this.tl.to({}, globals.displayDuration, {});
			}

			this.tl.to({}, 0.3, {
				onStart: function () {
					this.showMainLine1('');
					this.showMainLine2('');
				}.bind(this),
				onComplete: showCTA
			});
		}
	});
})();

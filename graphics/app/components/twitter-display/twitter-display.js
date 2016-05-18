requirejs(['debug'], debug => {
	'use strict';

	const BODY_DISPLAY_DURATION = 9;
	const BASE_IMAGE_DURATION = 5.5;
	const MIN_BOTTOM_BODY_MARGIN = 28;
	const imgPreloaderEl = document.createElement('img');

	function oneTime(target, type, callback) {
		const listener = function (e) {
			callback(e);
			e.target.removeEventListener(type, listener);
		};
		target.addEventListener(type, listener);
	}

	/* jshint -W064 */
	Polymer({
		/* jshint +W064 */

		is: 'twitter-display',

		properties: {
			bodyStyle: {
				type: Object,
				observer: '_bodyStyleChanged'
			},
			namebarStyle: {
				type: Object,
				observer: '_namebarStyleChanged'
			}
		},

		ready() {
			this._width = 0;
			const self = this;

			const background = this.$.background;
			let backgroundX = '-100%';
			const backgroundProxy = {};
			Object.defineProperty(backgroundProxy, 'x', {
				set(newVal) {
					const percentage = parseFloat(newVal) / 100;
					backgroundX = newVal;
					TweenLite.set(background, {
						x: Math.round(self._width * percentage)
					});
				},
				get() {
					return backgroundX;
				}
			});

			let selfX = '0%';
			const selfProxy = {};
			Object.defineProperty(selfProxy, 'x', {
				set(newVal) {
					const percentage = parseFloat(newVal) / 100;
					selfX = newVal;
					TweenLite.set(self, {
						x: Math.round(self._width * percentage)
					});
				},
				get() {
					return selfX;
				}
			});

			const tl = new TimelineLite({
				autoRemoveChilren: true,
				onComplete() {
					// Remove will-change every time the timeline is emptied
					self.$.background.style.willChange = '';
					self.$.image.style.willChange = '';
					self.$.namebar.style.willChange = '';
					self.$.body.style.willChange = '';
					self.style.willChange = '';
				}
			});

			nodecg.listenFor('showTweet', tweet => {
				// Set will-change on all the elements we're about to animate.
				this.$.background.style.willChange = 'transform';
				this.$.image.style.willChange = 'opacity';
				this.$.namebar.style.willChange = 'transform';
				this.$.body.style.willChange = 'opacity, transform';
				this.style.willChange = 'transform';

				// Reset
				tl.set(this, {visibility: 'visible'});
				tl.set(selfProxy, {x: '0%'});
				tl.set(backgroundProxy, {x: '-100%'});
				tl.set(self.$.namebar, {x: '100%'});
				tl.set(self.$.body, {opacity: 0, y: '-5%'});

				tl.to(backgroundProxy, 1, {
					onStart() {
						this.$.body.fontSize = `${this.bodyStyle.fontSize}px`;
						this.$.body.innerHTML = tweet.text;
						this.$.username.innerText = `@${tweet.user.screen_name}`;
						this.scaleDownBodyIfNecessary();
					},
					x: '0%',
					ease: Power3.easeInOut
				}, '+=0.2'); // Small delay to give `will-change` time to do its optimizations.

				// If this tweet has pictures...
				if (tweet.imageUrls && tweet.imageUrls.length > 0) {
					const imageDuration = BASE_IMAGE_DURATION - tweet.imageUrls.length * 0.5;
					tweet.imageUrls.forEach(url => {
						tl.call(() => {
							imgPreloaderEl.src = url;
							if (imgPreloaderEl.complete) {
								self.$.image.src = url;
							} else {
								tl.pause();
								oneTime(imgPreloaderEl, 'load', () => {
									self.$.image.src = url;
									tl.resume();
								});
							}
						});

						tl.to(this.$.image, 1, {
							onStart() {
								debug.time('tweetImageFadeIn');
							},
							opacity: 1,
							ease: Power1.easeInOut,
							onComplete() {
								debug.timeEnd('tweetImageFadeIn');
							}
						});

						tl.to(this.$.image, 1, {
							onStart() {
								debug.time('tweetImageFadeOut');
							},
							opacity: 0,
							ease: Power1.easeInOut,
							onComplete() {
								debug.timeEnd('tweetImageFadeOut');
							}
						}, `+=${imageDuration}`);
					});
				}

				tl.to(this.$.namebar, 0.7, {
					x: '0%',
					ease: Power2.easeOut
				}, '-=0.1');

				tl.to(this.$.body, 0.6, {
					y: '0%',
					opacity: 1,
					ease: Power1.easeOut
				}, '-=0.25');

				tl.to(selfProxy, 1, {
					x: '100%',
					ease: Power2.easeIn
				}, `+=${BODY_DISPLAY_DURATION}`);

				tl.set(this, {visibility: 'hidden'});

				// Padding
				tl.to({}, 0.1, {});
			});
		},

		_bodyStyleChanged(newVal) {
			// A bit of a hack, but recalc backgroundWidth whenever the body style is changed.
			this._width = this.getBoundingClientRect().width;

			const bodyEl = this.$.body;
			bodyEl.style.top = `${newVal.top}px`;
			bodyEl.style.fontSize = `${newVal.fontSize}px`;
			bodyEl.style.marginLeft = `${newVal.horizontalMargin}px`;
			bodyEl.style.marginRight = `${newVal.horizontalMargin}px`;
			this.async(this.scaleDownBodyIfNecessary);
		},

		_namebarStyleChanged(newVal) {
			const namebarEl = this.$.namebar;
			namebarEl.style.top = `${newVal.top}px`;
			namebarEl.style.width = `${newVal.width}px`;
			namebarEl.style.fontSize = `${newVal.fontSize}px`;
		},

		scaleDownBodyIfNecessary() {
			if (!this.$.body.innerHTML || !this.bodyStyle || !this.bodyStyle.top) {
				return;
			}

			// If the body is too close to the namebar, shrink the body's font size until it isn't
			while (this.$.body.getBoundingClientRect().bottom + MIN_BOTTOM_BODY_MARGIN > this.$.namebar.getBoundingClientRect().top) {
				const currentFontSize = parseInt(this.$.body.style.fontSize, 10);
				this.$.body.style.fontSize = `${currentFontSize - 1}px`;
			}
		}
	});
});

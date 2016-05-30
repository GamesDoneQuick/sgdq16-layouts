(function () {
	'use strict';

	const BODY_DISPLAY_DURATION = 9;
	const MIN_BOTTOM_BODY_MARGIN = 28;

	Polymer({
		is: 'gdq-twitter',

		ready() {
			this.tl = new TimelineLite({
				autoRemoveChilren: true,
				onComplete: function () {
					// Remove will-change every time the timeline is emptied
					this.$.namebar.style.willChange = '';
					this.$.body.style.willChange = '';
					this.style.willChange = '';
				}.bind(this)
			});

			nodecg.listenFor('showTweet', this.showTweet.bind(this));
		},

		showTweet(tweet) {
			const tl = this.tl;

			// Set will-change on all the elements we're about to animate.
			this.$.namebar.style.willChange = 'transform';
			this.$.body.style.willChange = 'opacity, transform';
			this.style.willChange = 'transform, opacity';

			// Reset
			tl.set(this, {opacity: 0, y: '0%'});
			tl.set(this.$.namebar, {opacity: 0, y: '100%'});
			tl.set(this.$.body, {opacity: 0, y: '-5%'});

			tl.call(() => {
				this.$.body.innerHTML = tweet.text;
				this.$.username.innerText = `@${tweet.user.screen_name}`;
				textFit(this.$.body);
			}, null, null, '+=0.2'); // Small delay to give `will-change` time to do its optimizations.

			tl.to(this, 0.33, {
				opacity: 1,
				ease: Power1.easeOut
			});

			tl.add('namebarIn', '-=0.09');
			tl.to(this.$.namebar, 0.33, {
				opacity: 1,
				ease: Power1.easeOut
			}, 'namebarIn');
			tl.to(this.$.namebar, 0.7, {
				y: '0%',
				ease: Back.easeOut
			}, 'namebarIn');

			tl.to(this.$.body, 0.6, {
				y: '0%',
				opacity: 1,
				ease: Power1.easeOut
			}, '-=0.25');

			tl.add('exit', `+=${BODY_DISPLAY_DURATION}`);
			tl.to(this, 0.4, {
				opacity: 0,
				ease: Power1.easeIn
			}, 'exit');
			tl.to([this.$.namebar, this.$.body], 0.4, {
				y: '25%',
				ease: Power2.easeIn
			}, 'exit');

			// Padding
			tl.to({}, 0.1, {});
		}
	});
})();

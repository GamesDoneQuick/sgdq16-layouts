(function () {
	'use strict';

	const TRANSITION_DURATION = 1.2;
	const DESCRIPTION_TRANSITION_DURATON = TRANSITION_DURATION / 2 - 0.1;
	const currentPrizes = nodecg.Replicant('currentPrizes');
	const displayDuration = nodecg.Replicant('displayDuration');

	Polymer({
		is: 'gdq-prizes',

		ready() {
			this.tl = new TimelineMax({repeat: -1});
			if (displayDuration.status === 'declared') {
				this.init();
			} else {
				displayDuration.once('declared', () => this.init());
			}
		},

		init() {
			const showPrize = this.showPrize.bind(this);
			currentPrizes.on('change', newVal => {
				this.tl.clear();
				this.tl.to(this.$.images, TRANSITION_DURATION / 2, {
					x: '0%',
					ease: Power2.easeInOut
				});
				this.tl.call(() => {
					newVal.forEach(showPrize);
				});
			});
		},

		/**
		 * Queues an animation to show a prize.
		 * @param {Object} prize - The prize to show.
		 * @returns {undefined}
		 */
		showPrize(prize) {
			if (!prize.image) {
				return;
			}

			const tl = this.tl;

			tl.call(() => {
				this.$.next.src = prize.image;
			}, null, null, '+=0.1');

			tl.add('prizeEnter');

			tl.to(this.$.images, TRANSITION_DURATION, {
				x: '-50%',
				ease: Power2.easeInOut
			}, 'prizeEnter');

			tl.to(this.$.description, DESCRIPTION_TRANSITION_DURATON, {
				y: '100%',
				ease: Power2.easeIn,
				onComplete: function () {
					this.$.descriptionText.textContent = prize.description;
				}.bind(this)
			}, 'prizeEnter');

			tl.to(this.$.description, DESCRIPTION_TRANSITION_DURATON, {
				y: '0%',
				ease: Power2.easeOut
			}, `-=${DESCRIPTION_TRANSITION_DURATON}`);

			tl.to({}, 0.1, {
				onComplete: function () {
					this.$.current.src = prize.image;
					TweenLite.set(this.$.images, {x: '0%'}, 'reset');
				}.bind(this)
			}, '+=0.1');

			tl.to({}, displayDuration.value, {});
		}
	});
})();

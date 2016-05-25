(function () {
	'use strict';

	const total = nodecg.Replicant('total');

	Polymer({
		is: 'gdq-omnibar',

		ready() {
			// Play the shine animation every 2 minutes.
			setInterval(() => {
				this.$.gdqLogo.play();
			}, 120 * 1000);

			this.$['total-text'].rawValue = 0;
			total.on('change', this.totalChanged.bind(this));
		},

		totalChanged(newVal) {
			const TIME_PER_DOLLAR = 0.03;
			const totalText = this.$['total-text'];
			const delta = newVal.raw - totalText.rawValue;
			const duration = Math.min(delta * TIME_PER_DOLLAR, 5);
			let strLen = totalText.textContent.length;
			TweenLite.to(totalText, duration, {
				rawValue: newVal.raw,
				ease: Power2.easeOut,
				onUpdate: function () {
					totalText.textContent = totalText.rawValue.toLocaleString('en-US', {
						style: 'currency',
						currency: 'USD',
						maximumFractionDigits: 0
					});

					if (totalText.textContent.length !== strLen) {
						this.fitMainText();
						strLen = totalText.textContent.length;
					}
				}.bind(this)
			});
		},

		fitMainText() {
			const maxWidth = this.$.main.clientWidth;
			console.log('fitMainText | maxWidth: %s', maxWidth);
			[this.$.mainLine1, this.$.mainLine2].forEach(element => {
				const elementWidth = element.clientWidth;
				if (elementWidth > maxWidth) {
					TweenLite.set(element, {scaleX: maxWidth / elementWidth});
				} else {
					TweenLite.set(element, {scaleX: 1});
				}
			});
		}
	});
})();

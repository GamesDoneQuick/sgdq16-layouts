(function () {
	Polymer({
		is: 'disabled-cover',

		properties: {
			reason: {
				type: String,
				observer: '_reasonChanged'
			}
		},

		_reasonChanged() {
			// This needs to be in a debounce, otherwise refreshing a specific panel's iframe can cause
			// Polymer to throw a cryptic error about Event not having an instanceof function.
			this.debounce('_handleReasonChanged', this._handleReasonChanged, 50);
		},

		_handleReasonChanged() {
			const reason = this.reason;

			if (reason) {
				const allReasons = Polymer.dom(this).querySelectorAll('[reason]');
				allReasons.forEach(child => {
					child.style.display = 'none';
				});

				const reasonToShow = Polymer.dom(this).querySelector(`[reason="${reason}"]`);
				if (reasonToShow) {
					reasonToShow.style.display = 'block';
					this.style.display = 'flex';
				} else {
					this.style.display = 'none';
				}
			} else {
				this.style.display = 'none';
			}
		}
	});
})();

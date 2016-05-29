(function () {
	'use strict';

	const currentRun = nodecg.Replicant('currentRun');

	Polymer({
		is: 'gdq-runinfo',

		properties: {
			maxNameSize: {
				type: Number,
				value: 80
			}
		},

		ready() {
			currentRun.on('change', this.currentRunChanged.bind(this));
		},

		currentRunChanged(newVal) {
			this.name = newVal.name;
			this.category = newVal.category;
			this.console = newVal.console;
			this.releaseYear = newVal.releaseYear;
			this.estimate = newVal.estimate;

			if (this.$.name.firstElementChild) {
				this.$.name.firstElementChild.innerText = newVal.name;
			} else {
				this.$.name.innerText = newVal.name;
			}

			if (this.initialized) {
				this.fitText();
			} else {
				this.async(this.fitText, 100);
				this.initialized = true;
			}
		},

		fitText() {
			Polymer.dom.flush();
			textFit(this.$.name, {maxFontSize: this.maxNameSize});

			const MAX_CATEGORY_WIDTH = this.clientWidth - 32;
			const categorySpan = this.$.category.firstElementChild;
			const categoryWidth = categorySpan.clientWidth;
			if (categoryWidth > MAX_CATEGORY_WIDTH) {
				TweenLite.set(categorySpan, {scaleX: MAX_CATEGORY_WIDTH / categoryWidth});
			} else {
				TweenLite.set(categorySpan, {scaleX: 1});
			}
		},

		calcReleaseYearDisplay(releaseYear) {
			if (releaseYear) {
				return ` - ${releaseYear}`;
			}
		}
	});
})();

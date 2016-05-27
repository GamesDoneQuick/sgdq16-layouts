(function () {
	'use strict';

	const currentRun = nodecg.Replicant('currentRun');

	Polymer({
		is: 'gdq-runinfo',

		ready() {
			currentRun.on('change', this.currentRunChanged.bind(this));
		},

		currentRunChanged(newVal) {
			this.name = newVal.name;
			this.category = newVal.category;
			this.console = newVal.console;
			this.releaseYear = newVal.releaseYear;
			this.estimate = newVal.estimate;
		}
	});
})();

(function () {
	'use strict';

	Polymer({
		is: 'gdq-schedule-runinfo',

		setRun(run) {
			this.name = run.name;
			this.console = run.console;
			this.runners = run.runners;
			this.releaseYear = run.releaseYear;
			this.estimate = run.estimate;
			this.category = run.category;
			this.order = run.order;
			this.notes = run.notes;
			this.originalValues = run.originalValues;
		},

		calcName(name) {
			if (name) {
				return name.split('\\n').join(' ');
			}

			return name;
		},

		calcModified(original) {
			return typeof original === 'undefined' || original === null ? '' : 'modified';
		}
	});
})();

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
		},

		calcName(name) {
			return name.split('\\n').join(' ');
		}
	});
})();

(function () {
	'use strict';

	const schedule = nodecg.Replicant('schedule');
	const currentRun = nodecg.Replicant('currentRun');

	Polymer({
		is: 'gdq-schedule',

		ready() {
			schedule.on('change', newVal => {
				this.$.typeahead.candidates = newVal.map(speedrun => speedrun.name);
			});

			currentRun.on('change', newVal => {
				if (!newVal) {
					return;
				}

				this.$.currentRun.setRun(newVal);

				// Disable "next" button if at end of schedule
				if (newVal.nextRun) {
					this.$.next.removeAttribute('disabled');
					this.$.nextRun.setRun(newVal.nextRun);
				} else {
					this.$.next.setAttribute('disabled', 'true');
					this.$.nextRun.clear();
				}

				// Disable "prev" button if at start of schedule
				if (newVal.order <= 1) {
					this.$.previous.setAttribute('disabled', 'true');
				} else {
					this.$.previous.removeAttribute('disabled');
				}
			});
		},

		/**
		 * Takes the current value of the typeahead and loads that as the current speedrun.
		 * Shows a helpful error toast if no matching speedrun could be found.
		 * @returns {undefined}
		 */
		takeTypeahead() {
			this.$.take.setAttribute('disabled', 'true');

			const nameToFind = this.$.typeahead.value;

			// Find the run based on the name.
			const matched = schedule.value.some(run => {
				if (run.name.toLowerCase() === nameToFind.toLowerCase()) {
					nodecg.sendMessage('setCurrentRunByOrder', run.order, () => {
						this.$.take.removeAttribute('disabled');
						this.$.typeahead.value = '';
						this.$.typeahead._suggestions = [];
					});
					return true;
				}

				return false;
			});

			if (!matched) {
				this.$.take.removeAttribute('disabled');
				this.$.toast.text = `Could not find speedrun with name "${nameToFind}".`;
				this.$.toast.show();
			}
		},

		fetchLatestSchedule() {
			this.$.fetchLatestSchedule.setAttribute('disabled', 'true');
			nodecg.sendMessage('updateSchedule', (err, updated) => {
				this.$.fetchLatestSchedule.removeAttribute('disabled');

				if (err) {
					console.error(err.message);
					this.$.toast.text = 'Error updating schedule. Check console.';
					this.$.toast.show();
					return;
				}

				if (updated) {
					console.info(`[${nodecg.bundleName}] Schedule successfully updated`);
					this.$.toast.text = 'Successfully updated schedule.';
					this.$.toast.show();
				} else {
					console.info(`[${nodecg.bundleName}] Schedule unchanged, not updated`);
					this.$.toast.text = 'Schedule unchanged, not updated.';
					this.$.toast.show();
				}
			});
		},

		next() {
			this.$.next.setAttribute('disabled', 'true');
			nodecg.sendMessage('nextRun');
		},

		previous() {
			this.$.previous.setAttribute('disabled', 'true');
			nodecg.sendMessage('previousRun');
		},

		_typeaheadKeyup(e) {
			// Enter key
			if (e.which === 13 && this.$.typeahead.inputValue) {
				this.takeTypeahead();
			}
		}
	});
})();

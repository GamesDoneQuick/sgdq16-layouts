(function () {
	'use strict';

	const toast = document.getElementById('toast');
	const update = document.getElementById('update');

	update.addEventListener('click', () => {
		update.setAttribute('disabled', 'true');
		nodecg.sendMessage('updateSchedule', (err, updated) => {
			update.removeAttribute('disabled');

			if (err) {
				console.error(err.message);
				toast.text = 'Error updating schedule. Check console.';
				toast.show();
				return;
			}

			if (updated) {
				console.info('[agdq16-layouts] Schedule successfully updated');
				toast.text = 'Successfully updated schedule.';
				toast.show();
			} else {
				console.info('[agdq16-layouts] Schedule unchanged, not updated');
				toast.text = 'Schedule unchanged, not updated.';
				toast.show();
			}
		});
	});

	/* ----- */

	const typeahead = document.getElementById('typeahead');
	typeahead.addEventListener('keyup', e => {
		// Enter key
		if (e.which === 13 && typeahead.inputValue) {
			takeTypeahead();
		}
	});

	const schedule = nodecg.Replicant('schedule');
	schedule.on('change', newVal => {
		typeahead.localCandidates = newVal.map(speedrun => {
			return speedrun.name;
		});
	});

	// This is quite inefficient, but it works for now.
	const take = document.getElementById('take');
	take.addEventListener('click', takeTypeahead);

	/**
	 * Takes the current value of the typeahead and loads that as the current speedrun.
	 * Shows a helpful error toast if no matching speedrun could be found.
	 * @returns {undefined}
	 */
	function takeTypeahead() {
		take.setAttribute('disabled', 'true');

		const nameToFind = typeahead.inputValue;

		// Find the run based on the name.
		const matched = schedule.value.some(run => {
			if (run.name.toLowerCase() === nameToFind.toLowerCase()) {
				nodecg.sendMessage('setCurrentRunByOrder', run.order, () => {
					take.removeAttribute('disabled');
					typeahead.inputValue = '';
					typeahead._suggestions = [];
				});
				return true;
			}

			return false;
		});

		if (!matched) {
			take.removeAttribute('disabled');
			toast.text = `Could not find speedrun with name "${nameToFind}".`;
			toast.show();
		}
	}

	/* ----- */

	const nextBtn = document.getElementById('next');
	const previousBtn = document.getElementById('previous');
	const nextRunSpan = document.getElementById('nextRun');

	nextBtn.addEventListener('click', () => {
		nextBtn.setAttribute('disabled', 'true');
		nodecg.sendMessage('nextRun');
	});

	previousBtn.addEventListener('click', () => {
		previousBtn.setAttribute('disabled', 'true');
		nodecg.sendMessage('previousRun');
	});

	schedule.on('declared', () => {
		const currentRun = nodecg.Replicant('currentRun');
		const runInfoName = document.querySelector('label-value[label="Name"]');
		const runInfoConsole = document.querySelector('label-value[label="Console"]');
		const runInfoRunners = document.querySelector('label-value[label="Runners"]');
		const runInfoReleaseYear = document.querySelector('label-value[label="Release Year"]');
		const runInfoEstimate = document.querySelector('label-value[label="Estimate"]');
		const runInfoCategory = document.querySelector('label-value[label="Category"]');
		const runInfoOrder = document.querySelector('label-value[label="Order"]');
		currentRun.on('change', newVal => {
			if (!newVal) {
				return;
			}

			runInfoName.value = newVal.name;
			runInfoConsole.value = newVal.console;
			runInfoRunners.value = newVal.concatenatedRunners;
			runInfoReleaseYear.value = newVal.releaseYear;
			runInfoEstimate.value = newVal.estimate;
			runInfoCategory.value = newVal.category;
			runInfoOrder.value = newVal.order;

			// Disable "next" button if at end of schedule
			if (newVal.nextRun) {
				nextRunSpan.innerText = newVal.nextRun.name;
				nextBtn.removeAttribute('disabled');
			} else {
				nextRunSpan.innerText = 'None';
				nextBtn.setAttribute('disabled', 'true');
			}

			// Disable "prev" button if at start of schedule
			if (newVal.order <= 1) {
				previousBtn.setAttribute('disabled', 'true');
			} else {
				previousBtn.removeAttribute('disabled');
			}
		});
	});
})();

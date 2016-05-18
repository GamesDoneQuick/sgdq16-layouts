(function () {
	'use strict';

	const nameEl = document.querySelector('paper-input[label="Name"]');
	const releaseYearEl = document.querySelector('paper-input[label="Release Year"]');
	const consoleEl = document.getElementById('consoleListbox');
	const estimateEl = document.querySelector('paper-input[label="Estimate"]');
	const categoryEl = document.querySelector('paper-input[label="Category"]');
	const runners = document.getElementById('runners');

	const currentRun = nodecg.Replicant('currentRun');
	currentRun.on('change', newVal => {
		nameEl.value = newVal.name;
		releaseYearEl.value = newVal.releaseYear;
		consoleEl.select(newVal.console.toUpperCase());
		estimateEl.value = newVal.estimate;
		categoryEl.value = newVal.category;

		// Remove all current edit-runner elements.
		while (runners.firstChild) {
			runners.removeChild(runners.firstChild);
		}

		// Add the new edit-runner element.
		newVal.runners.forEach((runner, index) => {
			const editRunnerEl = document.createElement('edit-runner');
			editRunnerEl.runner = runner;
			editRunnerEl.index = index;
			runners.appendChild(editRunnerEl);
		});
	});

	document.addEventListener('dialog-confirmed', () => {
		currentRun.value.name = nameEl.value;
		currentRun.value.releaseYear = releaseYearEl.value;
		currentRun.value.console = consoleEl.selected;
		currentRun.value.estimate = estimateEl.value;
		currentRun.value.category = categoryEl.value;

		const numRunners = currentRun.value.runners.length;
		for (let i = 0; i < numRunners; i++) {
			const editRunnerEl = document.querySelector(`edit-runner:nth-child(${i + 1})`);
			currentRun.value.runners[i].name = editRunnerEl.$.nameInput.value;
			currentRun.value.runners[i].stream = editRunnerEl.$.streamInput.value;
		}

		const runners = currentRun.value.runners;
		let concatenatedRunners;
		if (runners.length === 1) {
			concatenatedRunners = runners[0].name;
		} else {
			concatenatedRunners = runners.reduce((prev, curr) => {
				if (typeof prev === 'object') {
					return `${prev.name}, ${curr.name}`;
				}

				return `${prev}, ${curr.name}`;
			});
		}

		currentRun.value.concatenatedRunners = concatenatedRunners;
	});
})();

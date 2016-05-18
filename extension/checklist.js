'use strict';

module.exports = function (nodecg) {
	// Create defaults array
	const checklistDefault = [
		{name: 'Check for Interview', complete: false},
		{name: 'Cue game music', complete: false},
		{name: 'Check for Advertisement', complete: false},
		{name: 'Commentator Mics', complete: false},
		{name: 'Runner Game Audio', complete: false},
		{name: 'TVs have Video', complete: false},
		{name: 'Restart Recording', complete: false},
		{name: 'Stream Audio', complete: false},
		{name: 'Stream Video & Deinterlacing', complete: false},
		{name: 'Stream Layout', complete: false},
		{name: 'RACE ONLY: Confirm Runner Names Match Game Positions', complete: false},
		{name: 'STEAM ONLY: Turn off Steam notifications', complete: false},
		{name: 'Camera', complete: false},
		{name: 'Reset Timer', complete: false},
		{name: 'Check Notes', complete: false}
	];

	// Instantiate replicant with defaults object, which will load if no persisted data is present.
	const checklist = nodecg.Replicant('checklist', {defaultValue: checklistDefault});

	// If any entries in the config aren't present in the replicant,
	// (which could happen when a persisted replicant value is loaded) add them.
	checklistDefault.forEach(task => {
		const exists = checklist.value.some(existingTask => existingTask.name === task.name);
		if (!exists) {
			checklist.value.push(task);
		}
	});

	// Likewise, if there are any entries in the replicant that are no longer present in the config, remove them.
	checklist.value.forEach((existingTask, index) => {
		const exists = checklistDefault.some(task => task.name === existingTask.name);
		if (!exists) {
			checklist.value.splice(index, 1);
		}
	});

	const checklistComplete = nodecg.Replicant('checklistComplete', {defaultValue: false});
	checklist.on('change', newVal => {
		const numUnfinishedTasks = newVal.filter(task => !task.complete).length;
		checklistComplete.value = numUnfinishedTasks === 0;
	});

	return {
		reset() {
			checklist.value.forEach(task => {
				task.complete = false;
			});
		}
	};
};

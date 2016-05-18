(function () {
	'use strict';

	const listEl = document.getElementById('list');
	const checklist = nodecg.Replicant('checklist');
	checklist.on('change', newVal => {
		// Update all checkboxes, or add new ones if needed.
		newVal.forEach(task => {
			const existingPaperCheckbox = document.querySelector(`paper-checkbox[taskName="${task.name}"]`);
			if (existingPaperCheckbox) {
				existingPaperCheckbox.checked = task.complete;
			} else {
				const paperCheckbox = document.createElement('paper-checkbox');
				paperCheckbox.setAttribute('taskName', task.name);
				paperCheckbox.querySelector('#checkboxLabel').textContent = task.name;
				paperCheckbox.checked = task.complete;
				listEl.appendChild(paperCheckbox);
			}
		});

		// Find and remove any checkboxes that are no longer needed.
		const checkboxes = Array.prototype.slice.call(document.querySelectorAll('paper-checkbox'));
		checkboxes.forEach(checkbox => {
			const taskName = checkbox.getAttribute('taskName');
			const foundTask = checklist.value.some(task => task.name === taskName);
			if (!foundTask) {
				checkbox.remove();
			}
		});
	});

	document.addEventListener('change', e => {
		const taskName = e.target.getAttribute('taskName');
		checklist.value.some(task => {
			if (task.name === taskName) {
				task.complete = e.target.checked;
				return true;
			}

			return false;
		});
	});
})();

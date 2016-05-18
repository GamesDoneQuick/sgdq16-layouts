(function () {
	'use strict';

	const resetDialog = document.getElementById('resetDialog');
	const confirmReset = document.getElementById('confirmReset');
	const editDialog = document.getElementById('editDialog');
	const confirmEdit = document.getElementById('confirmEdit');
	const editInput = document.getElementById('editInput');

	const startAll = document.getElementById('startAll');
	startAll.addEventListener('click', () => {
		nodecg.sendMessage('startTime', 'all');
	});

	const pauseAll = document.getElementById('pauseAll');
	pauseAll.addEventListener('click', () => {
		nodecg.sendMessage('pauseTime', 'all');
	});

	const resetAll = document.getElementById('resetAll');
	resetAll.addEventListener('click', () => {
		window.setDialogInfo('all', 'everyone');
		resetDialog.open();
	});

	/* ----- */

	const globalButtons = document.getElementById('globalButtons');
	const startButtons = Array.from(document.querySelectorAll('#play'));
	const checklistStatusContainer = document.getElementById('checklistStatusContainer');
	const checklistStatus = document.getElementById('checklistStatus');

	const checklistComplete = nodecg.Replicant('checklistComplete');
	checklistComplete.on('change', newVal => {
		if (newVal) {
			startButtons.forEach(button => button.removeAttribute('disabled'));

			startAll.removeAttribute('disabled');
			startAll.querySelector('#startAll-notReady').style.display = 'none';
			startAll.querySelector('#startAll-ready').style.display = 'flex';

			checklistStatus.innerText = 'Checklist Complete';
			checklistStatus.style.fontWeight = 'normal';
			checklistStatusContainer.style.backgroundColor = '';
			globalButtons.style.backgroundColor = '';
		} else {
			startButtons.forEach(button => button.setAttribute('disabled', 'true'));

			startAll.setAttribute('disabled', 'true');
			startAll.querySelector('#startAll-notReady').style.display = 'inline';
			startAll.querySelector('#startAll-ready').style.display = 'none';

			checklistStatus.innerText = 'Checklist Incomplete, complete before starting';
			checklistStatus.style.fontWeight = 'bold';
			checklistStatusContainer.style.backgroundColor = '#ff6d6b';
			globalButtons.style.backgroundColor = '#ff6d6b';
		}
	});

	/* ----- */

	const runnerNameEls = Array.from(document.getElementsByClassName('runnerName'));
	let dialogIndex = 0;

	window.setDialogInfo = function (index, name, currentTime) {
		dialogIndex = index;

		runnerNameEls.forEach(el => {
			el.innerText = name;
		});

		if (currentTime) {
			editInput.value = currentTime;
		}
	};

	/* ----- */

	confirmReset.addEventListener('click', () => {
		confirmReset.setAttribute('disabled', 'true');
		nodecg.sendMessage('resetTime', dialogIndex, () => {
			resetDialog.close();
			confirmReset.removeAttribute('disabled');
		});
	});

	/* ----- */

	editInput.addEventListener('iron-input-validate', e => {
		// e.target.validity.valid seems to be busted. Use this workaround.
		const isValid = !e.target.hasAttribute('invalid');
		if (isValid) {
			confirmEdit.removeAttribute('disabled');
		} else {
			confirmEdit.setAttribute('disabled', 'true');
		}
	});

	confirmEdit.addEventListener('click', () => {
		if (editInput.validate()) {
			const ts = editInput.value.split(':');
			const ms = Date.UTC(1970, 0, 1, ts[0], ts[1], ts[2]);

			confirmEdit.setAttribute('disabled', 'true');
			nodecg.sendMessage('setTime', {index: dialogIndex, milliseconds: ms}, () => {
				editDialog.close();
				confirmEdit.removeAttribute('disabled');
			});
		}
	});
})();

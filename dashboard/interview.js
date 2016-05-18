(function () {
	'use strict';

	const disabledCover = document.getElementById('cover');

	const layoutState = nodecg.Replicant('layoutState');
	layoutState.on('change', newVal => {
		if (newVal.page === 'open') {
			if (layoutState.value.currentLayout === 'interview') {
				disabledCover.reason = null;
			} else {
				disabledCover.reason = 'badLayout';
			}
		} else {
			disabledCover.reason = newVal.page;
		}
	});

	/* ----- */

	const interviewNames = nodecg.Replicant('interviewNames');
	const take = document.getElementById('take');
	take.addEventListener('click', () => {
		interviewNames.value = [
			document.getElementById('preview1').value,
			document.getElementById('preview2').value,
			document.getElementById('preview3').value,
			document.getElementById('preview4').value
		];
	});

	interviewNames.on('change', newVal => {
		document.getElementById('program1').value = newVal[0];
		document.getElementById('program2').value = newVal[1];
		document.getElementById('program3').value = newVal[2];
		document.getElementById('program4').value = newVal[3];
	});

	/* ------ */

	const show = document.getElementById('show');
	const hide = document.getElementById('hide');
	const auto = document.getElementById('auto');
	const showing = nodecg.Replicant('interviewLowerthirdShowing');

	show.addEventListener('click', () => {
		showing.value = true;
	});

	hide.addEventListener('click', () => {
		showing.value = false;
	});

	auto.addEventListener('click', () => {
		nodecg.sendMessage('pulseInterviewLowerthird', 10);
	});

	showing.on('change', newVal => {
		if (newVal) {
			show.setAttribute('disabled', 'true');
			hide.removeAttribute('disabled');
			auto.setAttribute('disabled', 'true');
		} else {
			show.removeAttribute('disabled');
			hide.setAttribute('disabled', 'true');
			auto.removeAttribute('disabled');
		}
	});

	nodecg.Replicant('interviewLowerthirdPulsing').on('change', newVal => {
		const shouldDisableHideButton = showing.value ? newVal : true;
		if (shouldDisableHideButton) {
			hide.setAttribute('disabled', 'true');
		} else {
			hide.removeAttribute('disabled');
		}
	});
})();

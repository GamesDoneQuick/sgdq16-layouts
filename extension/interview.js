'use strict';

module.exports = function (nodecg) {
	const lowerthirdShowing = nodecg.Replicant('interviewLowerthirdShowing', {defaultValue: false, persistent: false});
	const lowerthirdPulsing = nodecg.Replicant('interviewLowerthirdPulsing', {defaultValue: false, persistent: false});
	let timeout;
	nodecg.Replicant('interviewNames', {defaultValue: [], persistent: false});

	lowerthirdShowing.on('change', newVal => {
		if (!newVal) {
			clearTimeout(timeout);
			lowerthirdPulsing.value = false;
		}
	});

	nodecg.listenFor('pulseInterviewLowerthird', duration => {
		// Don't stack pulses
		if (lowerthirdPulsing.value) {
			return;
		}

		lowerthirdShowing.value = true;
		lowerthirdPulsing.value = true;

		// End pulse after "duration" seconds
		timeout = setTimeout(() => {
			lowerthirdShowing.value = false;
			lowerthirdPulsing.value = false;
		}, duration * 1000);
	});
};

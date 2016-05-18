/* global define */
define(() => {
	'use strict';

	const currentBidsRep = nodecg.Replicant('currentBids');
	const scheduleRep = nodecg.Replicant('schedule');
	const currentRunRep = nodecg.Replicant('currentRun');
	const totalRep = nodecg.Replicant('total');
	const displayDurationRep = nodecg.Replicant('displayDuration');
	const stopwatchesRep = nodecg.Replicant('stopwatches');
	const gameAudioChannelsRep = nodecg.Replicant('gameAudioChannels');

	/* ----- */

	const currentPrizesRep = nodecg.Replicant('currentPrizes');
	let currentGrandPrizes;
	let currentNormalPrizes;
	currentPrizesRep.on('change', newVal => {
		currentGrandPrizes = newVal.filter(prize => prize.grand);
		currentNormalPrizes = newVal.filter(prize => !prize.grand);
	});

	/* ----- */

	// This is really fragile, but whatever.
	const NUM_REPLICANTS = 8;
	let loadedReplicants = 0;

	currentBidsRep.on('declared', replicantDeclared);
	scheduleRep.on('declared', replicantDeclared);
	currentRunRep.on('declared', replicantDeclared);
	currentPrizesRep.on('declared', replicantDeclared);
	totalRep.on('declared', replicantDeclared);
	displayDurationRep.on('declared', replicantDeclared);
	stopwatchesRep.on('declared', replicantDeclared);
	gameAudioChannelsRep.on('declared', replicantDeclared);

	function replicantDeclared() {
		loadedReplicants++;
		if (loadedReplicants === NUM_REPLICANTS) {
			document.dispatchEvent(new CustomEvent('replicantsDeclared'));
			window.replicantsDeclared = true;
		}
	}

	/* ----- */

	return Object.create(Object.prototype, {
		// Bids
		currentBids: {
			get() {
				return currentBidsRep.value;
			}
		},

		// Prizes
		currentPrizesRep: {
			value: currentPrizesRep
		},
		currentGrandPrizes: {
			get() {
				return currentGrandPrizes;
			}
		},
		currentNormalPrizes: {
			get() {
				return currentNormalPrizes;
			}
		},

		// Schedule
		schedule: {
			get() {
				return scheduleRep.value;
			}
		},
		currentRun: {
			get() {
				return currentRunRep.value;
			}
		},
		nextRun: {
			get() {
				return currentRunRep.value.nextRun;
			}
		},
		currentRunRep: {
			value: currentRunRep
		},

		// Other
		totalRep: {
			value: totalRep
		},
		displayDuration: {
			get() {
				return displayDurationRep.value;
			}
		},
		stopwatchesRep: {
			value: stopwatchesRep
		},
		gameAudioChannelsRep: {
			value: gameAudioChannelsRep
		}
	});
});

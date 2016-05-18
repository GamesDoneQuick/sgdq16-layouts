'use strict';

const clone = require('clone');
const Rieussec = require('rieussec');
const NUM_STOPWATCHES = 4;

module.exports = function (nodecg) {
	const defaultStopwatch = {time: '0:00:00', state: 'stopped', milliseconds: 0, runnerName: '?', place: 0};
	const stopwatches = nodecg.Replicant('stopwatches', {
		defaultValue: [
			clone(defaultStopwatch),
			clone(defaultStopwatch),
			clone(defaultStopwatch),
			clone(defaultStopwatch)
		]
	});

	// Add the runner's name to the stopwatch, because testrunner needs that for his API stuff.
	const currentRun = nodecg.Replicant('currentRun');
	currentRun.on('change', newVal => {
		if (newVal.runners) {
			for (let i = 0; i < NUM_STOPWATCHES; i++) {
				const runner = newVal.runners[i];
				stopwatches.value[i].runnerName = runner ? runner.name : '?';
			}
		} else {
			for (let i = 0; i < NUM_STOPWATCHES; i++) {
				stopwatches.value[i].runnerName = '?';
			}
		}
	});

	// Make an array of 4 Rieussec stopwatches
	const rieussecs = [null, null, null, null].map((val, index) => {
		const stopwatch = stopwatches.value[index];

		// Load the existing time and start the stopwatch at that.
		let startMs = 0;
		if (stopwatch.time) {
			const ts = stopwatch.time.split(':');
			startMs = Date.UTC(1970, 0, 1, ts[0], ts[1], ts[2]);

			if (stopwatch.state === 'running') {
				startMs += Date.now() - stopwatch.lastTick;
			}
		}

		const rieussec = new Rieussec();
		rieussec.setMilliseconds(startMs);

		if (stopwatch.state === 'running') {
			rieussec.start();
		}

		rieussec.on('tick', ms => {
			stopwatch.time = msToTime(ms);
			stopwatch.milliseconds = ms;

			if (stopwatch.state === 'running') {
				stopwatch.lastTick = Date.now();
			} else {
				stopwatch.lastTick = null;
			}
		});

		return rieussec;
	});

	nodecg.listenFor('startTime', handleStartTimeRequest);
	nodecg.listenFor('pauseTime', handlePauseTimeRequest);
	nodecg.listenFor('finishTime', handleFinishTimeRequest);
	nodecg.listenFor('resetTime', handleResetTimeRequest);
	nodecg.listenFor('setTime', handleSetTimeRequest);

	const app = require('express')();

	if (nodecg.bundleConfig && nodecg.bundleConfig.enableRestApi) {
		nodecg.log.warn('"enableRestApi" is true, the stopwatch REST API will be active.');
		nodecg.log.warn('This API is COMPLETELY INSECURE. ONLY USE IT ON A SECURE LOCAL NETWORK.');

		app.get('/agdq16-layouts/stopwatches', (req, res) => {
			res.json(stopwatches.value);
		});

		app.put('/agdq16-layouts/stopwatch/:index/start', (req, res) => {
			const result = handleStartTimeRequest(req.params.index);
			if (result) {
				res.status(200).json(result);
			} else {
				res.status(422).send(`Invalid stopwatch index "${req.params.index}"`);
			}
		});

		app.put('/agdq16-layouts/stopwatch/:index/pause', (req, res) => {
			const result = handlePauseTimeRequest(req.params.index);
			if (result) {
				res.status(200).json(result);
			} else {
				res.status(422).send(`Invalid stopwatch index "${req.params.index}"`);
			}
		});

		app.put('/agdq16-layouts/stopwatch/:index/finish', (req, res) => {
			const result = handleFinishTimeRequest(req.params.index);
			if (result) {
				res.status(200).json(result);
			} else {
				res.status(422).send(`Invalid stopwatch index "${req.params.index}"`);
			}
		});

		app.put('/agdq16-layouts/stopwatch/:index/reset', (req, res) => {
			const result = handleResetTimeRequest(req.params.index);
			if (result) {
				res.status(200).json(result);
			} else {
				res.status(422).send(`Invalid stopwatch index "${req.params.index}"`);
			}
		});

		app.put('/agdq16-layouts/stopwatch/:index/startfinish', (req, res) => {
			const index = req.params.index;
			let result;

			if (index === 'all') {
				for (let i = 0; i < NUM_STOPWATCHES; i++) {
					startFinishStopwatch(i);
				}
				result = stopwatches.value;
			} else {
				result = startFinishStopwatch(index);
			}

			if (result) {
				res.status(200).json(result);
			} else {
				res.status(422).send(`Invalid stopwatch index "${req.params.index}"`);
			}
		});
	} else {
		nodecg.log.info('"enableRestApi" is false, the stopwatch REST API will be unavailable');
	}

	app.get('/agdq16-layouts/stopwatches/control', nodecg.util.authCheck, (req, res) => {
		res.redirect('/graphics/agdq16-layouts/custom_controls/stopwatches/index.html');
	});

	nodecg.mount(app);

	function handleStartTimeRequest(index) {
		if (index === 'all') {
			for (let i = 0; i < NUM_STOPWATCHES; i++) {
				startStopwatch(i);
			}
			return stopwatches.value;
		}

		return startStopwatch(index);
	}

	function handlePauseTimeRequest(index) {
		if (index === 'all') {
			for (let i = 0; i < NUM_STOPWATCHES; i++) {
				pauseStopwatch(i);
			}
			return stopwatches.value;
		}

		return pauseStopwatch(index);
	}

	function handleFinishTimeRequest(index) {
		if (index === 'all') {
			for (let i = 0; i < NUM_STOPWATCHES; i++) {
				finishStopwatch(i);
			}
			return stopwatches.value;
		}

		return finishStopwatch(index);
	}

	function handleResetTimeRequest(index, cb) {
		let retValue;

		if (index === 'all') {
			for (let i = 0; i < NUM_STOPWATCHES; i++) {
				resetStopwatch(i);
			}
			retValue = stopwatches.value;
		} else {
			retValue = resetStopwatch(index);
		}

		if (typeof cb === 'function') {
			cb(retValue);
		}

		return retValue;
	}

	function handleSetTimeRequest(data, cb) {
		let retValue;

		if (data.index === 'all') {
			for (let i = 0; i < NUM_STOPWATCHES; i++) {
				setStopwatch({index: i, ms: data.milliseconds});
			}
			retValue = stopwatches.value;
		} else {
			retValue = setStopwatch(data);
		}

		if (typeof cb === 'function') {
			cb();
		}

		return retValue;
	}

	function startStopwatch(index) {
		if (index < 0 || index >= NUM_STOPWATCHES) {
			nodecg.log.error('index "%d" sent to "startStopwatch" is out of bounds', index);
			return;
		}

		rieussecs[index].start();
		stopwatches.value[index].state = 'running';
		recalcPlaces();
		return stopwatches.value[index];
	}

	function pauseStopwatch(index) {
		if (index < 0 || index >= NUM_STOPWATCHES) {
			nodecg.log.error('index "%d" sent to "pauseStopwatch" is out of bounds', index);
			return;
		}

		rieussecs[index].pause();
		stopwatches.value[index].state = 'paused';
		recalcPlaces();
		return stopwatches.value[index];
	}

	function finishStopwatch(index) {
		if (index < 0 || index >= NUM_STOPWATCHES) {
			nodecg.log.error('index "%d" sent to "finishTime" is out of bounds', index);
			return;
		}

		const stopwatch = stopwatches.value[index];
		if (stopwatch.state === 'finished') {
			return;
		}

		rieussecs[index].pause();
		stopwatch.state = 'finished';
		recalcPlaces();

		return stopwatch;
	}

	function resetStopwatch(index) {
		if (index < 0 || index >= NUM_STOPWATCHES) {
			nodecg.log.error('index "%d" sent to "resetStopwatch" is out of bounds', index);
			return;
		}

		rieussecs[index].reset();
		stopwatches.value[index].milliseconds = 0;
		stopwatches.value[index].lastTick = null;
		stopwatches.value[index].state = 'stopped';
		recalcPlaces();

		return stopwatches.value[index];
	}

	function startFinishStopwatch(index) {
		if (index < 0 || index >= NUM_STOPWATCHES) {
			nodecg.log.error('index "%d" sent to "startFinishStopwatch" is out of bounds', index);
			return;
		}

		if (stopwatches.value[index].state === 'running') {
			finishStopwatch(index);
		} else {
			startStopwatch(index);
		}

		return stopwatches.value[index];
	}

	function setStopwatch(data) {
		const index = data.index;
		if (index < 0 || index >= NUM_STOPWATCHES) {
			nodecg.log.error('index "%d" sent to "setStopwatch" is out of bounds', index);
			return;
		}

		const targetRieussec = rieussecs[index];
		const targetStopwatch = stopwatches.value[index];

		// Pause all timers while we do our work.
		// Best way to ensure that all the tick cycles stay in sync.
		rieussecs.forEach(rieussec => {
			rieussec._wasRunningBeforeEdit = rieussec._state === 'running';

			if (rieussec._wasRunningBeforeEdit) {
				rieussec.pause();
			}
		});

		targetRieussec.setMilliseconds(data.milliseconds, true);

		rieussecs.forEach(rieussec => {
			if (rieussec._wasRunningBeforeEdit) {
				rieussec.start();
			}
		});

		return targetStopwatch;
	}

	function recalcPlaces() {
		const finishedStopwatches = stopwatches.value.filter(s => {
			s.place = 0;
			return s.state === 'finished';
		});

		finishedStopwatches.sort((a, b) => {
			return a.milliseconds - b.milliseconds;
		});

		finishedStopwatches.forEach((s, index) => {
			s.place = index + 1;
		});
	}
};

function msToTime(duration) {
	// This rounding is extremely important. It prevents all sorts of errors!
	duration = Math.floor(duration);

	let hours = parseInt((duration / (1000 * 60 * 60)) % 24, 10);
	let minutes = parseInt((duration / (1000 * 60)) % 60, 10);
	let seconds = parseInt((duration / 1000) % 60, 10);

	hours = (hours < 10) ? hours : hours;
	minutes = (minutes < 10) ? `0${minutes}` : minutes;
	seconds = (seconds < 10) ? `0${seconds}` : seconds;

	return `${hours}:${minutes}:${seconds}`;
}

'use strict';

const TimeObject = require('./classes/time-object');
let interval;

module.exports = function (nodecg) {
	const currentRun = nodecg.Replicant('currentRun');
	const stopwatch = nodecg.Replicant('stopwatch', {
		defaultValue: (function () {
			const to = new TimeObject(0);
			to.state = 'stopped';
			to.results = [null, null, null, null];
			return to;
		})()
	});

	// Load the existing time and start the stopwatch at that.
	if (stopwatch.value.state === 'running') {
		const missedSeconds = Math.round((Date.now() - stopwatch.value.timestamp) / 1000);
		TimeObject.setSeconds(stopwatch.value, stopwatch.value.seconds + missedSeconds);
		start();
	}

	let serialPort;
	if (nodecg.bundleConfig.serialCOMName) {
		nodecg.log.info(`[timekeeping] Setting up serial communications via ${nodecg.bundleConfig.serialCOMName}`);
		const SerialPort = require('serialport').SerialPort;
		serialPort = new SerialPort(nodecg.bundleConfig.serialCOMName, {
			parser: require('serialport').parsers.readline('\n')
		}, err => {
			if (err) {
				return nodecg.log.error(err.message);
			}
		});

		serialPort.on('data', data => {
			switch (data) {
				case 'startFinish':
					if (stopwatch.value.state === 'running') {
						// Finish all runners.
						currentRun.value.runners.forEach((runner, index) => {
							if (!runner) {
								return;
							}

							completeRunner({index, forfeit: false});
						});
					} else {
						start();
					}
					break;
				default:
					nodecg.log.error('[timekeeping] Unexpected data from serial port:', data);
			}
		});

		let lastState;
		stopwatch.on('change', newVal => {
			if (newVal.state !== lastState) {
				lastState = newVal.state;

				const args = [];
				switch (newVal.state) {
					case 'finished':
						args.push(stopwatch.value.results);
						break;
					default:
						// Do nothing.
				}

				if (serialPort && serialPort.isOpen()) {
					serialPort.write(JSON.stringify({event: newVal.state, arguments: args}));
				}
			}
		});
	}

	nodecg.listenFor('startTimer', start);
	nodecg.listenFor('stopTimer', stop);
	nodecg.listenFor('resetTimer', reset);
	nodecg.listenFor('completeRunner', completeRunner);
	nodecg.listenFor('resumeRunner', resumeRunner);
	nodecg.listenFor('editResult', editResult);

	/**
	 * Starts the timer.
	 * @returns {undefined}
	 */
	function start() {
		if (stopwatch.value.state === 'running') {
			return;
		}

		stopwatch.value.state = 'running';
		interval = setInterval(tick, 1000);
	}

	/**
	 * Increments the timer by one second.
	 * @returns {undefined}
	 */
	function tick() {
		TimeObject.increment(stopwatch.value);

		if (serialPort && serialPort.isOpen()) {
			serialPort.write(JSON.stringify({
				event: 'tick',
				arguments: [stopwatch.value.raw]
			}));
		}
	}

	/**
	 * Stops the timer.
	 * @returns {undefined}
	 */
	function stop() {
		clearInterval(interval);
		stopwatch.value.state = 'stopped';
	}

	/**
	 * Stops and resets the timer, clearing the time and results.
	 * @returns {undefined}
	 */
	function reset() {
		stop();
		TimeObject.setSeconds(stopwatch.value, 0);
		stopwatch.value.results = [];
	}

	/**
	 * Marks a runner as complete.
	 * @param {Number} index - The runner to modify (0-3).
	 * @param {Boolean} forfeit - Whether or not the runner forfeit.
	 * @returns {undefined}
	 */
	function completeRunner({index, forfeit}) {
		if (!stopwatch.value.results[index]) {
			stopwatch.value.results[index] = new TimeObject(stopwatch.value.raw);
		}

		stopwatch.value.results[index].forfeit = forfeit;
		recalcPlaces();
	}

	/**
	 * Marks a runner as still running.
	 * @param {Number} index - The runner to modify (0-3).
	 * @returns {undefined}
	 */
	function resumeRunner(index) {
		stopwatch.value.results[index] = null;
		recalcPlaces();

		if (stopwatch.value.state === 'finished') {
			const missedSeconds = Math.round((Date.now() - stopwatch.value.timestamp) / 1000);
			TimeObject.setSeconds(stopwatch.value, stopwatch.value.seconds + missedSeconds);
			start();
		}
	}

	/**
	 * Edits the final time of a result.
	 * @param {Number} index - The result index to edit.
	 * @param {String} newTime - A hh:mm:ss (or mm:ss) formatted new time.
	 * @returns {undefined}
	 */
	function editResult({index, newTime}) {
		if (newTime && stopwatch.value.results[index]) {
			TimeObject.setSeconds(stopwatch.value.results[index], TimeObject.parseSeconds(newTime));
			recalcPlaces();
		}
	}

	/**
	 * Re-calculates the podium place for all runners.
	 * @returns {undefined}
	 */
	function recalcPlaces() {
		const finishedResults = stopwatch.value.results.filter(r => {
			if (r) {
				r.place = 0;
				return !r.forfeit;
			}

			return false;
		});

		finishedResults.sort((a, b) => {
			return a.raw - b.raw;
		});

		finishedResults.forEach((r, index) => {
			r.place = index + 1;
		});

		// If every runner is finished, stop ticking and set timer state to "finished".
		let allRunnersFinished = true;
		currentRun.value.runners.forEach((runner, index) => {
			if (!runner) {
				return;
			}

			if (!stopwatch.value.results[index]) {
				allRunnersFinished = false;
			}
		});

		if (allRunnersFinished) {
			stop();
			stopwatch.value.state = 'finished';
		}
	}
};

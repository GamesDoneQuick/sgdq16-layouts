'use strict';

const fs = require('fs');
const path = require('path');
const rp = require('request-promise');
const clone = require('clone');
const Q = require('q');
const equals = require('deep-equal');

const POLL_INTERVAL = 60 * 1000;

module.exports = function (nodecg) {
	const checklist = require('./checklist')(nodecg);
	const scheduleRep = nodecg.Replicant('schedule', {defaultValue: [], persistent: false});
	const currentRun = nodecg.Replicant('currentRun', {defaultValue: {}});

	// Get initial data
	update();

	// Get latest schedule data every POLL_INTERVAL milliseconds
	nodecg.log.info('Polling schedule every %d seconds...', POLL_INTERVAL / 1000);
	let updateInterval = setInterval(update.bind(this), POLL_INTERVAL);

	// Dashboard can invoke manual updates
	nodecg.listenFor('updateSchedule', (data, cb) => {
		nodecg.log.info('Manual schedule update button pressed, invoking update...');
		clearInterval(updateInterval);
		updateInterval = setInterval(update.bind(this), POLL_INTERVAL);
		update()
			.then(updated => {
				if (updated) {
					nodecg.log.info('Schedule successfully updated');
				} else {
					nodecg.log.info('Schedule unchanged, not updated');
				}

				cb(null, updated);
			}, error => {
				cb(error);
			});
	});

	nodecg.listenFor('nextRun', cb => {
		const nextIndex = currentRun.value.nextRun.order - 1;
		_setCurrentRun(scheduleRep.value[nextIndex]);
		checklist.reset();

		if (typeof cb === 'function') {
			cb();
		}
	});

	nodecg.listenFor('previousRun', cb => {
		const prevIndex = currentRun.value.order - 2;
		_setCurrentRun(scheduleRep.value[prevIndex]);
		checklist.reset();

		if (typeof cb === 'function') {
			cb();
		}
	});

	nodecg.listenFor('setCurrentRunByOrder', (order, cb) => {
		_setCurrentRun(scheduleRep.value[order - 1]);

		if (typeof cb === 'function') {
			cb();
		}
	});

	/**
	 * Gets the latest schedule info from the GDQ tracker.
	 * @returns {Promise.<T>|*} - A Q.spread promise.
	 */
	function update() {
		const deferred = Q.defer();

		const runnersPromise = rp({
			uri: 'https://gamesdonequick.com/tracker/search',
			qs: {
				type: 'runner',
				event: 17
			},
			json: true
		});

		const schedulePromise = rp({
			uri: 'https://gamesdonequick.com/tracker/search',
			qs: {
				type: 'run',
				event: 17
			},
			json: true
		});

		return Q.spread([runnersPromise, schedulePromise], (runnersJSON, scheduleJSON) => {
			const allRunners = [];
			runnersJSON.forEach(obj => {
				obj.fields.stream = obj.fields.stream.split('/').pop();
				allRunners[obj.pk] = obj.fields;
			});

			/* jshint -W106 */
			const formattedSchedule = scheduleJSON.map(run => {
				const boxartName = new Buffer(run.fields.display_name).toString('base64');
				const boxartPath = path.resolve(__dirname, `../graphics/img/boxart/${boxartName}.jpg`);
				let boxartUrl = `/graphics/${nodecg.bundleName}/img/boxart/default.png`;

				if (fs.existsSync(boxartPath)) {
					boxartUrl = `/graphics/${nodecg.bundleName}/img/boxart/${boxartName}.jpg`;
				}

				const runners = run.fields.runners.map(runnerId => allRunners[runnerId]);

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

				return {
					name: run.fields.display_name || 'Unknown',
					console: run.fields.console || 'Unknown',
					commentators: run.fields.commentators || 'Unknown',
					category: run.fields.category || 'Any%',
					startTime: Date.parse(run.fields.starttime) || null,
					order: run.fields.order,
					estimate: run.fields.run_time || 'Unknown',
					releaseYear: run.fields.release_year,
					runners,
					concatenatedRunners,
					boxart: {
						url: boxartUrl
					},
					type: 'run'
				};
			});
			/* jshint +W106 */

			// If nothing has changed, return.
			if (equals(formattedSchedule, scheduleRep.value)) {
				deferred.resolve(false);
				return;
			}

			scheduleRep.value = formattedSchedule;

			// If no currentRun is set or if the order of the current run is greater than
			// the length of the schedule, set current run to the first run.
			if (typeof currentRun.value.order === 'undefined' ||
				currentRun.value.order > scheduleRep.value.length) {
				_setCurrentRun(scheduleRep.value[0]);
			}

			// TODO: This is commented out because it blows away any manual edits made to currentRun.
			// TODO: Need to figure out a merge system that preserves manual edits when they don't conflict.
			/* // Else, update the currentRun
			 else {
			 // First, try to find the current run by name.
			 const updatedCurrentRun = formattedSchedule.some(function(run) {
			 if (run.name === currentRun.value.name) {
			 _setCurrentRun(run);
			 return true;
			 }
			 });

			 // If that fails, try to update it by order.
			 if (!updatedCurrentRun) {
			 formattedSchedule.some(function(run) {
			 if (run.order === currentRun.value.order) {
			 _setCurrentRun(run);
			 return true;
			 }
			 });
			 }
			 }*/
		}).catch(err => {
			nodecg.log.error('[schedule] Failed to update:', err.stack);
		});
	}

	/**
	 * Sets the currentRun replicant.
	 * @param {Object} run - The run to set as the new currentRun.
	 * @private
	 * @returns {undefined}
	 */
	function _setCurrentRun(run) {
		const cr = clone(run);

		// `order` is always `index+1`. So, if there is another run in the schedule after this one, add it as `nextRun`.
		if (scheduleRep.value[cr.order]) {
			cr.nextRun = scheduleRep.value[cr.order];
		}

		currentRun.value = cr;
	}
};

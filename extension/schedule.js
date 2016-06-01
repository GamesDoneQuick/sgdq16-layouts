'use strict';

const LOGIN_URL = 'https://private.gamesdonequick.com/tracker/admin/login/?next=/tracker/admin/';
const POLL_INTERVAL = 60 * 1000;
const fs = require('fs');
const path = require('path');
const request = require('request-promise').defaults({jar: true}); // <= Automatically saves and re-uses cookies.
const clone = require('clone');
const Q = require('q');
const equals = require('deep-equal');
const assign = require('lodash.assign');
const cheerio = require('cheerio');
const {calcOriginalValues, mergeChangesFromTracker} = require('./lib/diff-run');
const server = require('../../../lib/server');
let updateInterval;

module.exports = function (nodecg) {
	const checklist = require('./checklist')(nodecg);
	const scheduleRep = nodecg.Replicant('schedule', {defaultValue: [], persistent: false});
	const currentRun = nodecg.Replicant('currentRun', {defaultValue: {}});
	const nextRun = nodecg.Replicant('nextRun', {defaultValue: {}});

	// If a "streamTitle" template has been defined in the bundle config, and if lfg-twitch api is present,
	// automatically update the Twitch game and title when currentRun changes.
	if (nodecg.bundleConfig.streamTitle) {
		server.on('extensionsLoaded', () => {
			const twitchApi = nodecg.extensions['lfg-twitchapi'];
			if (!twitchApi) {
				return nodecg.log.warn('Automatic stream title updating is disabled because lfg-twitchapi is not installed.');
			}

			nodecg.log.info('Automatic stream title updating is enabled.');
			let lastLongName;
			currentRun.on('change', newVal => {
				if (newVal.longName !== lastLongName) {
					lastLongName = newVal.longName;
					twitchApi.put('/channels/{{username}}', {
						channel: {
							status: nodecg.bundleConfig.streamTitle.replace('${gameName}', newVal.longName),
							game: newVal.longName
						}
					}).then(response => {
						if (response.statusCode !== 200) {
							return nodecg.log.error(response.body.error, response.body.message);
						}
					}).catch(err => {
						nodecg.log.error(err);
					});
				}
			});
		});
	}

	// Fetch the login page, and run the response body through cheerio
	// so we can extract the CSRF token from the hidden input field.
	// Then, POST with our username, password, and the csrfmiddlewaretoken.
	request({
		uri: LOGIN_URL,
		transform(body) {
			return cheerio.load(body);
		}
	}).then($ => request({
		method: 'POST',
		uri: LOGIN_URL,
		form: {
			username: nodecg.bundleConfig.tracker.username,
			password: nodecg.bundleConfig.tracker.password,
			csrfmiddlewaretoken: $('#login-form > input[name="csrfmiddlewaretoken"]').val()
		},
		headers: {
			Referer: LOGIN_URL
		},
		resolveWithFullResponse: true
	})).then(() => {
		update();

		// Get latest schedule data every POLL_INTERVAL milliseconds
		nodecg.log.info('Polling schedule every %d seconds...', POLL_INTERVAL / 1000);
		updateInterval = setInterval(update.bind(this), POLL_INTERVAL);

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
	}).catch(err => {
		console.error(err);
	});

	nodecg.listenFor('nextRun', cb => {
		_seekToNextRun();
		if (typeof cb === 'function') {
			cb();
		}
	});

	nodecg.listenFor('previousRun', cb => {
		_seekToPreviousRun();
		if (typeof cb === 'function') {
			cb();
		}
	});

	nodecg.listenFor('setCurrentRunByOrder', (order, cb) => {
		const run = scheduleRep.value[order - 1];
		if (run) {
			_seekToArbitraryRun(scheduleRep.value[order - 1]);
		} else {
			nodecg.log.error(`Tried to set currentRun to non-existent order: ${order}`);
		}

		if (typeof cb === 'function') {
			cb();
		}
	});

	nodecg.listenFor('modifyRun', (data, cb) => {
		let run;
		if (currentRun.value.pk === data.pk) {
			run = currentRun.value;
		} else if (nextRun.value.pk === data.pk) {
			run = nextRun.value;
		}

		if (run) {
			let original;
			if (scheduleRep.value[run.order - 1] && scheduleRep.value[run.order - 1].pk === run.pk) {
				original = scheduleRep.value[run.order - 1];
			} else {
				original = scheduleRep.value.find(r => r.pk === run.pk);
			}

			if (original) {
				assign(run, data);
				run.originalValues = calcOriginalValues(run, original);
			} else {
				nodecg.log.error('[modifyRun] Found current/next run, but couldn\'t find original in schedule. Aborting.');
			}
		} else {
			console.warn('[modifyRun] run not found:', data);
		}

		if (typeof cb === 'function') {
			cb();
		}
	});

	nodecg.listenFor('resetRun', (pk, cb) => {
		let runRep;
		if (currentRun.value.pk === pk) {
			runRep = currentRun;
		} else if (nextRun.value.pk === pk) {
			runRep = nextRun;
		}

		if (runRep) {
			runRep.value = scheduleRep.value.find(r => r.pk === pk);
		}

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

		const runnersPromise = request({
			uri: nodecg.bundleConfig.useMockData ?
				'https://dl.dropboxusercontent.com/u/6089084/gdq_mock/runners.json' :
				'https://private.gamesdonequick.com/tracker/search',
			qs: {
				type: 'runner',
				event: 18
			},
			json: true
		});

		const schedulePromise = request({
			uri: nodecg.bundleConfig.useMockData ?
				'https://dl.dropboxusercontent.com/u/6089084/gdq_mock/schedule.json' :
				'https://private.gamesdonequick.com/tracker/search',
			qs: {
				type: 'run',
				event: 18
			},
			json: true
		});

		return Q.spread([runnersPromise, schedulePromise], (runnersJSON, scheduleJSON) => {
			const formattedRunners = [];
			runnersJSON.forEach(obj => {
				obj.fields.stream = obj.fields.stream.split('/').pop();
				formattedRunners[obj.pk] = obj.fields;
			});

			const formattedSchedule = calcFormattedSchedule(formattedRunners, scheduleJSON);

			// If nothing has changed, return.
			if (equals(formattedSchedule, scheduleRep.value)) {
				deferred.resolve(false);
				return;
			}

			scheduleRep.value = formattedSchedule;

			/* If no currentRun is set or if the order of the current run is greater than
			 * the length of the schedule, set current run to the first run.
			 * Else, update the currentRun by pk, merging with and local changes.
			 */
			if (!currentRun.value || typeof currentRun.value.order === 'undefined' ||
				currentRun.value.order > scheduleRep.value.length) {
				_seekToArbitraryRun(scheduleRep.value[0]);
			} else {
				const currentRunAsInSchedule = formattedSchedule.find(run => run.pk === currentRun.value.pk);

				/* If currentRun was found in the schedule, merge any changes from the schedule into currentRun.
				 * Else if currentRun has been removed from the schedule (determined by its `pk`),
				 * set currentRun to whatever run now has currentRun's `order` value.
				 * Else, set currentRun to the final run in the schedule.
				 */
				if (currentRunAsInSchedule) {
					[currentRun, nextRun].forEach(activeRun => {
						const runFromSchedule = formattedSchedule.find(run => run.pk === activeRun.value.pk);
						activeRun.value = mergeChangesFromTracker(activeRun.value, runFromSchedule);
					});
				} else if (formattedSchedule[currentRun.order - 1]) {
					_seekToArbitraryRun(formattedSchedule[currentRun.order - 1]);
				} else {
					_seekToArbitraryRun(formattedSchedule[formattedSchedule.length - 1]);
				}
			}
		}).catch(err => {
			nodecg.log.error('[schedule] Failed to update:', err.stack);
		});
	}

	/**
	 * Seeks to the previous run in the schedule, updating currentRun and nextRun accordingly.
	 * Clones the value of currentRun into nextRun.
	 * Sets currentRun to the predecessor run.
	 * @private
	 * @returns {undefined}
	 */
	function _seekToPreviousRun() {
		const prevIndex = currentRun.value.order - 2;
		nextRun.value = clone(currentRun.value);
		currentRun.value = clone(scheduleRep.value[prevIndex]);
		checklist.reset();
	}

	/**
	 * Seeks to the next run in the schedule, updating currentRun and nextRun accordingly.
	 * Clones the value of nextRun into currentRun.
	 * Sets nextRun to the new successor run.
	 * @private
	 * @returns {undefined}
	 */
	function _seekToNextRun() {
		const newNextIndex = nextRun.value.order;
		currentRun.value = clone(nextRun.value);
		nextRun.value = clone(scheduleRep.value[newNextIndex]);
		checklist.reset();
	}

	/**
	 * Sets the currentRun replicant to an arbitrary run, first checking if that run is previous or next,
	 * relative to any existing currentRun.
	 * If so, call _seekToPreviousRun or _seekToNextRun, accordingly. This preserves local changes.
	 * Else, blow away currentRun and nextRun and replace them with the new run and its successor.
	 * @param {Object} run - The run to set as the new currentRun.
	 * @returns {undefined}
	 */
	function _seekToArbitraryRun(run) {
		if (run.order === currentRun.value.order + 1) {
			_seekToNextRun();
		} else if (run.order === currentRun.value.order - 1) {
			_seekToPreviousRun();
		} else {
			const clonedRun = clone(run);
			currentRun.value = clonedRun;

			// `order` is always `index+1`. So, if there is another run in the schedule after this one, add it as `nextRun`.
			if (scheduleRep.value[clonedRun.order]) {
				nextRun.value = clone(scheduleRep.value[clonedRun.order]);
			} else {
				nextRun.value = {};
			}

			checklist.reset();
		}
	}

	/**
	 * Generates a formatted schedule.
	 * @param {Array} formattedRunners - A pre-formatted array of hydrated runner objects.
	 * @param {Array} scheduleJSON - The raw schedule array from the Tracker.
	 * @returns {Array} - A formatted schedule.
	 */
	function calcFormattedSchedule(formattedRunners, scheduleJSON) {
		return scheduleJSON.map((run, index) => {
			const boxartName = new Buffer(run.fields.display_name).toString('base64');
			const boxartPath = path.resolve(__dirname, `../graphics/img/boxart/${boxartName}.jpg`);
			let boxartUrl = `/graphics/${nodecg.bundleName}/img/boxart/default.png`;

			if (fs.existsSync(boxartPath)) {
				boxartUrl = `/graphics/${nodecg.bundleName}/img/boxart/${boxartName}.jpg`;
			}

			const runners = run.fields.runners.map(runnerId => {
				return {
					name: formattedRunners[runnerId].name,
					stream: formattedRunners[runnerId].stream
				};
			});

			return {
				name: run.fields.display_name || 'Unknown',
				longName: run.fields.name || 'Unknown',
				console: run.fields.console || 'Unknown',
				commentators: run.fields.commentators || 'Unknown',
				category: run.fields.category || 'Any%',
				startTime: Date.parse(run.fields.starttime) || null,
				order: index + 1,
				estimate: run.fields.run_time || 'Unknown',
				releaseYear: run.fields.release_year || '',
				runners,
				boxart: {
					url: boxartUrl
				},
				type: 'run',
				notes: run.fields.tech_notes || '',
				coop: run.fields.coop || false,
				pk: run.pk
			};
		});
	}
};

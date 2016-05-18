'use strict';

const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const format = require('util').format;
const debounce = require('debounce');
const md5File = require('md5-file');

const ADVERTISEMENTS_PATH = path.resolve(__dirname, '../graphics/advertisements');
const BASE_URL = '/graphics/agdq16-layouts/advertisements/';
const IMAGE_EXTS = ['.png', '.jpg', '.gif'];
const VIDEO_EXTS = ['.webm'];

module.exports = function (nodecg) {
	nodecg.log.info('Monitoring "%s" for changes to advertisement assets...', ADVERTISEMENTS_PATH);

	const currentRun = nodecg.Replicant('currentRun');
	nodecg.listenFor('logAdPlay', ad => {
		const logStr = format('%s, %s, %s, %s\n',
			new Date().toISOString(), ad.filename, currentRun.value.name, currentRun.value.concatenatedRunners);

		fs.appendFile('logs/ad_log.csv', logStr, err => {
			if (err) {
				nodecg.log.error('[advertisements] Error appending to log:', err.stack);
			}
		});
	});

	const ads = nodecg.Replicant('ads', {defaultValue: [], persistent: false});
	nodecg.Replicant('ftb', {defaultValue: false});

	const watcher = chokidar.watch([
		`${ADVERTISEMENTS_PATH}/*.png`,
		`${ADVERTISEMENTS_PATH}/*.jpg`,
		`${ADVERTISEMENTS_PATH}/*.gif`,
		`${ADVERTISEMENTS_PATH}/*.webm`
	], {
		ignored: /[\/\\]\./,
		persistent: true,
		ignoreInitial: true
	});

	watcher.on('add', debounce(reloadAdvertisements, 500));
	watcher.on('change', debounce(reloadAdvertisements, 500));

	watcher.on('unlink', filepath => {
		const adFilename = path.basename(filepath);
		nodecg.log.info('Advertisement "%s" deleted, removing from list...', adFilename);

		ads.value.some((ad, index) => {
			if (ad.filename === adFilename) {
				const adData = ads.value[index];
				ads.value.splice(index, 1);
				nodecg.sendMessage('adRemoved', adData);
				return true;
			}

			return false;
		});
	});

	watcher.on('error', e => {
		nodecg.error(e.stack);
	});

	// Initialize
	reloadAdvertisements();

	// On changed/added
	function reloadAdvertisements(filepath) {
		if (filepath) {
			nodecg.log.info('Advertisement "%s" changed, reloading all advertisements...', path.basename(filepath));
		}

		// Scan the images dir
		const adsDir = fs.readdirSync(ADVERTISEMENTS_PATH);
		adsDir.forEach(adFilename => {
			const ext = path.extname(adFilename);
			const adPath = path.join(ADVERTISEMENTS_PATH, adFilename);

			let type;
			if (isImage(ext)) {
				type = 'image';
			} else if (isVideo(ext)) {
				type = 'video';
			} else {
				return;
			}

			md5File(adPath, (err, sum) => {
				if (err) {
					nodecg.log.error(err);
					return;
				}

				const adData = {
					url: BASE_URL + adFilename,
					filename: adFilename,
					type,
					checksum: sum
				};

				// Look for an existing entry in the replicant with this filename, and update if found and md5 changed.
				const foundExistingAd = ads.value.some((ad, index) => {
					if (ad.filename === adFilename) {
						if (ad.checksum !== sum) {
							ads.value[index] = adData;
							nodecg.sendMessage('adChanged', adData);
						}
						return true;
					}

					return false;
				});

				// If there was no existing ad with this filename, add a new one.
				if (!foundExistingAd) {
					ads.value.push(adData);
					nodecg.sendMessage('newAd', adData);
				}
			});
		});
	}
};

function isImage(ext) {
	return IMAGE_EXTS.indexOf(ext) >= 0;
}

function isVideo(ext) {
	return VIDEO_EXTS.indexOf(ext) >= 0;
}

'use strict';

const chokidar = require('chokidar');
const debounce = require('debounce');
const fs = require('fs');
const md5File = require('md5-file');
const path = require('path');

const SPONSOR_IMAGES_PATH = path.resolve(__dirname, '../graphics/img/sponsors');
const BASE_URL = '/graphics/agdq16-layouts/img/sponsors/';
const ALLOWED_EXTS = [
	'.png'
];

module.exports = function (nodecg) {
	nodecg.log.info('Monitoring "%s" for changes to sponsor logos...', SPONSOR_IMAGES_PATH);

	const sponsors = nodecg.Replicant('sponsors', {defaultValue: [], persistent: false});
	const watcher = chokidar.watch(`${SPONSOR_IMAGES_PATH}/*.png`, {
		ignored: /[\/\\]\./,
		ignoreInitial: true
	});

	watcher.on('add', debounce(reloadSponsors, 500));
	watcher.on('change', debounce(reloadSponsors, 500));

	watcher.on('unlink', filepath => {
		const parsedPath = path.parse(filepath);
		const nameParts = parsedPath.name.split('-');
		const sponsorName = nameParts[0];
		const orientation = nameParts[1];

		if (!sponsorName || !isValidOrientation(orientation) || nameParts.length !== 2) {
			return;
		}

		sponsors.value.some((sponsor, index) => {
			if (sponsor.name === sponsorName) {
				sponsor[orientation] = null;
				if (!sponsor.vertical && !sponsor.horizontal) {
					sponsors.value.splice(index, 1);
				}
				nodecg.log.info('[sponsors] "%s" deleted, removing from rotation', parsedPath.base);
				return true;
			}

			return false;
		});
	});

	watcher.on('error', e => {
		nodecg.error(e.stack);
	});

	// Initialize
	reloadSponsors();

	// On changed/added
	function reloadSponsors(changeOrAddition) {
		if (changeOrAddition) {
			nodecg.log.info('[sponsors] Change detected, reloading all sponsors...');
		}

		// Scan the images dir
		const sponsorsDir = fs.readdirSync(SPONSOR_IMAGES_PATH);
		sponsorsDir.forEach(filename => {
			const ext = path.extname(filename);
			const filepath = path.join(SPONSOR_IMAGES_PATH, filename);

			if (!extAllowed(ext)) {
				return;
			}

			const parsedPath = path.parse(filepath);
			const nameParts = parsedPath.name.split('-');
			const sponsorName = nameParts[0];
			const orientation = nameParts[1];

			if (!sponsorName || !isValidOrientation(orientation) || nameParts.length !== 2) {
				nodecg.log.error('[sponsors] Unexpected file name "%s". ' +
					'Please rename to this format: {name}-{orientation}.png', filename);
				return;
			}

			md5File(filepath, (err, sum) => {
				if (err) {
					nodecg.log.error(err);
					return;
				}

				const fileData = {
					url: BASE_URL + filename,
					filename,
					checksum: sum
				};

				// Look for an existing entry in the replicant with this filename, and update if found and md5 changed.
				const foundExistingSponsor = sponsors.value.some(sponsor => {
					if (sponsor.name === sponsorName) {
						if (!sponsor[orientation] || sponsor[orientation].checksum !== sum) {
							sponsor[orientation] = fileData;
						}
						return true;
					}

					return false;
				});

				// If there was no existing sponsor with this filename, add a new one.
				if (!foundExistingSponsor) {
					const sponsor = {name: sponsorName};
					sponsor[orientation] = fileData;
					sponsors.value.push(sponsor);
				}
			});
		});
	}
};

function extAllowed(ext) {
	return ALLOWED_EXTS.indexOf(ext) >= 0;
}

function isValidOrientation(orientation) {
	if (typeof orientation !== 'string') {
		return false;
	}

	return orientation === 'horizontal' || orientation === 'vertical';
}

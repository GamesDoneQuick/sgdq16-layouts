'use strict';

module.exports = function (nodecg) {
	const sponsorAssets = nodecg.Replicant('assets:sponsors');
	const sponsors = nodecg.Replicant('sponsors', {defaultValue: [], persistent: false});
	sponsorAssets.on('change', newVal => {
		const newSponsorsArr = [];
		newVal.forEach(asset => {
			const nameParts = asset.name.split('-');
			const sponsorName = nameParts[0];
			const orientation = nameParts[1];

			if (!sponsorName || !isValidOrientation(orientation) || nameParts.length !== 2) {
				nodecg.log.error('[sponsors] Unexpected file name "%s". ' +
					'Please rename to this format: {name}-{orientation}.png', asset.base);
				return;
			}

			const existing = newSponsorsArr.find(s => s.name === sponsorName);
			if (existing) {
				existing[orientation] = asset;
			} else {
				const sponsor = {name: sponsorName};
				sponsor[orientation] = asset;
				sponsors.value.push(sponsor);
			}
		});

		sponsors.value = newSponsorsArr;
	});

	/**
	 * Checks if an orientation is valid ("horizontal", or "vertical")
	 * @param {String} orientation - The orientation to validate.
	 * @returns {boolean} - Whether or not this is a valid orientation string.
	 */
	function isValidOrientation(orientation) {
		if (typeof orientation !== 'string') {
			return false;
		}

		return orientation === 'horizontal' || orientation === 'vertical';
	}
};

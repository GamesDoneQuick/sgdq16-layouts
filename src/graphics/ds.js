'use strict';

const Layout = require('./classes/layout');

module.exports = new Layout('ds', () => {
	const speedrun = require('./components/speedrun');
	const nameplates = require('./components/nameplates');

	speedrun.configure(882, 291, 398, 127, {
		nameY: 18,
		categoryY: 80,
		nameMaxHeight: 80
	});

	nameplates.configure({}, [{
		x: 882,
		y: 418,
		width: 398,
		height: 54,
		nameFontSize: 28,
		estimateFontSize: 18,
		timeFontSize: 48
	}]);
});

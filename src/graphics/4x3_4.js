'use strict';

const Layout = require('./classes/layout');
const speedrun = require('./components/speedrun');
const compactNameplates = require('./components/compact_nameplates');

module.exports = new Layout('4x3_4', () => {
	speedrun.configure(442, 154, 396, 170, {
		nameY: 20,
		categoryY: 81,
		nameMaxHeight: 70,
		showEstimate: true
	});

	compactNameplates.configure([
		{
			threeOrMore: true,
			bottomBorder: true
		}, {
			threeOrMore: true,
			y: 78,
			alignRight: true
		}, {
			threeOrMore: true,
			y: 511,
			bottomBorder: true
		}, {
			threeOrMore: true,
			y: 589,
			alignRight: true
		}
	]);
});

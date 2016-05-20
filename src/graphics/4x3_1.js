'use strict';

const COLUMN_WIDTH = 398;
const COLUMN_X = 882;
const Layout = require('./classes/layout');
const sponsorsAndTwitter = document.getElementById('sponsorsAndTwitter');
const sponsorDisplay = document.querySelector('sponsor-display');
const twitterDisplay = document.querySelector('twitter-display');

module.exports = new Layout('4x3_1', () => {
	const speedrun = require('./components/speedrun');
	const nameplates = require('./components/nameplates');

	speedrun.configure(COLUMN_X, 0, COLUMN_WIDTH, 146, {
		nameY: 28,
		categoryY: 94,
		nameMaxHeight: 80
	});

	nameplates.configure({}, [{
		x: COLUMN_X,
		y: 383,
		width: COLUMN_WIDTH,
		height: 52,
		nameFontSize: 24,
		estimateFontSize: 18,
		timeFontSize: 48,
		bottomBorder: true
	}]);

	sponsorsAndTwitter.style.top = '437px';
	sponsorsAndTwitter.style.left = `${COLUMN_X}px`;
	sponsorsAndTwitter.style.width = `${COLUMN_WIDTH}px`;
	sponsorsAndTwitter.style.height = '228px';

	sponsorDisplay.orientation = 'horizontal';
	sponsorDisplay.style.padding = '40px 30px';

	twitterDisplay.bodyStyle = {
		fontSize: 24,
		top: 39,
		horizontalMargin: 14
	};
	twitterDisplay.namebarStyle = {
		top: 160,
		width: 373,
		fontSize: 28
	};
});

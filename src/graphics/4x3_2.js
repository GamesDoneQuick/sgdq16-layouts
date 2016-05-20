'use strict';

const COLUMN_WIDTH = 430;
const RIGHT_COLUMN_X = 850;
const Layout = require('./classes/layout');
const speedrun = require('./components/speedrun');
const nameplates = require('./components/nameplates');
const sponsorsAndTwitter = document.getElementById('sponsorsAndTwitter');
const sponsorDisplay = document.querySelector('sponsor-display');
const twitterDisplay = document.querySelector('twitter-display');

module.exports = new Layout('4x3_2', () => {
	speedrun.configure(0, 536, COLUMN_WIDTH, 130, {
		nameY: 15,
		categoryY: 81,
		nameMaxHeight: 80
	});

	nameplates.configure({
		nameFontSize: 28,
		estimateFontSize: 18,
		timeFontSize: 48,
		width: COLUMN_WIDTH,
		height: 52,
		y: 481,
		bottomBorder: true,
		audioIcon: true
	}, [
		{
			x: 0,
			alignment: 'right'
		}, {
			x: RIGHT_COLUMN_X,
			alignment: 'left'
		}
	]);

	sponsorsAndTwitter.style.top = '535px';
	sponsorsAndTwitter.style.left = `${RIGHT_COLUMN_X}px`;
	sponsorsAndTwitter.style.width = `${COLUMN_WIDTH}px`;
	sponsorsAndTwitter.style.height = '130px';

	sponsorDisplay.orientation = 'horizontal';
	sponsorDisplay.style.padding = '20px 20px';

	twitterDisplay.bodyStyle = {
		fontSize: 17,
		top: 11,
		horizontalMargin: 10
	};
	twitterDisplay.namebarStyle = {
		top: 86,
		width: 373,
		fontSize: 26
	};
});

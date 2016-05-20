'use strict';

const Layout = require('./classes/layout');
const sponsorsAndTwitter = document.getElementById('sponsorsAndTwitter');
const sponsorDisplay = document.querySelector('sponsor-display');
const twitterDisplay = document.querySelector('twitter-display');

module.exports = new Layout('3ds', () => {
	const speedrun = require('./components/speedrun');
	const nameplates = require('./components/nameplates');

	speedrun.configure(0, 567, 335, 98, {
		scale: 0.834,
		nameY: 10,
		nameMaxHeight: 50,
		categoryY: 64
	});

	nameplates.configure({}, [{
		x: 335,
		y: 581,
		width: 592,
		height: 70,
		nameFontSize: 40,
		estimateFontSize: 28,
		timeFontSize: 68
	}]);

	sponsorsAndTwitter.style.top = '477px';
	sponsorsAndTwitter.style.left = '928px';
	sponsorsAndTwitter.style.width = '352px';
	sponsorsAndTwitter.style.height = '188px';

	sponsorDisplay.orientation = 'horizontal';
	sponsorDisplay.style.padding = '20px 20px';

	twitterDisplay.bodyStyle = {
		fontSize: 25,
		top: 19,
		horizontalMargin: 10
	};

	twitterDisplay.namebarStyle = {
		top: 137,
		width: 316,
		fontSize: 22
	};
});

/* global define */
define([
	'components/background',
	'components/speedrun',
	'components/nameplates'
], (setBackground, speedrun, nameplates) => {
	'use strict';

	const LAYOUT_NAME = '3x2_1';
	const COLUMN_X = 950;
	const COLUMN_WIDTH = 330;
	const sponsorsAndTwitter = document.getElementById('sponsorsAndTwitter');
	const sponsorDisplay = document.querySelector('sponsor-display');
	const twitterDisplay = document.querySelector('twitter-display');

	return {
		attached() {
			setBackground(LAYOUT_NAME);

			speedrun.configure(COLUMN_X, 0, COLUMN_WIDTH, 146, {
				scale: 0.834,
				nameY: 26,
				nameMaxHeight: 80,
				categoryY: 97
			});

			nameplates.configure({}, [{
				x: COLUMN_X,
				y: 341,
				width: COLUMN_WIDTH,
				height: 45,
				nameFontSize: 23,
				estimateFontSize: 15,
				timeFontSize: 40,
				bottomBorder: true
			}]);

			sponsorsAndTwitter.style.top = '388px';
			sponsorsAndTwitter.style.left = `${COLUMN_X}px`;
			sponsorsAndTwitter.style.width = `${COLUMN_WIDTH}px`;
			sponsorsAndTwitter.style.height = '277px';

			sponsorDisplay.orientation = 'vertical';
			sponsorDisplay.style.padding = '20px 30px';

			twitterDisplay.bodyStyle = {
				fontSize: 25,
				top: 30,
				horizontalMargin: 16
			};

			twitterDisplay.namebarStyle = {
				top: 220,
				width: 304,
				fontSize: 21
			};
		}
	};
});

/* global define */
define([
	'components/background',
	'components/speedrun',
	'components/nameplates'
], (setBackground, speedrun, nameplates) => {
	'use strict';

	const LAYOUT_NAME = 'ds_portrait';
	const COLUMN_WIDTH = 305;
	const COLUMN_X = 975;

	const sponsorsAndTwitter = document.getElementById('sponsorsAndTwitter');
	const sponsorDisplay = document.querySelector('sponsor-display');
	const twitterDisplay = document.querySelector('twitter-display');

	return {
		attached() {
			setBackground(LAYOUT_NAME);

			speedrun.configure(COLUMN_X, 0, COLUMN_WIDTH, 151, {
				nameY: 29,
				categoryY: 89,
				nameMaxHeight: 70
			});

			nameplates.configure({}, [{
				x: COLUMN_X,
				y: 151,
				width: COLUMN_WIDTH,
				height: 54,
				nameFontSize: 24,
				estimateFontSize: 18,
				timeFontSize: 36
			}]);

			sponsorsAndTwitter.style.top = '384px';
			sponsorsAndTwitter.style.left = `${COLUMN_X}px`;
			sponsorsAndTwitter.style.width = `${COLUMN_WIDTH}px`;
			sponsorsAndTwitter.style.height = '281px';

			sponsorDisplay.orientation = 'vertical';
			sponsorDisplay.style.padding = '20px 20px';

			twitterDisplay.bodyStyle = {
				fontSize: 21,
				top: 18,
				horizontalMargin: 13
			};
			twitterDisplay.namebarStyle = {
				top: 207,
				width: 284,
				fontSize: 20
			};
		}
	};
});

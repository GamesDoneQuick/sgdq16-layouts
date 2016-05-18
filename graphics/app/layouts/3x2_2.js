/* global define */
define([
	'components/background',
	'components/speedrun',
	'components/nameplates'
], (setBackground, speedrun, nameplates) => {
	'use strict';

	const LAYOUT_NAME = '3x2_2';
	const COLUMN_WIDTH = 430;
	const RIGHT_COLUMN_X = 850;
	const sponsorsAndTwitter = document.getElementById('sponsorsAndTwitter');
	const sponsorDisplay = document.querySelector('sponsor-display');
	const twitterDisplay = document.querySelector('twitter-display');

	return {
		attached() {
			setBackground(LAYOUT_NAME);

			speedrun.configure(0, 481, COLUMN_WIDTH, 184, {
				nameY: 35,
				categoryY: 124,
				nameMaxHeight: 90
			});

			nameplates.configure({
				nameFontSize: 28,
				estimateFontSize: 18,
				timeFontSize: 48,
				width: COLUMN_WIDTH,
				height: 52,
				y: 427,
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

			sponsorsAndTwitter.style.top = '481px';
			sponsorsAndTwitter.style.left = `${RIGHT_COLUMN_X}px`;
			sponsorsAndTwitter.style.width = `${COLUMN_WIDTH}px`;
			sponsorsAndTwitter.style.height = '184px';

			sponsorDisplay.orientation = 'horizontal';
			sponsorDisplay.style.padding = '40px 20px';

			twitterDisplay.bodyStyle = {
				fontSize: 23,
				top: 19,
				horizontalMargin: 16
			};

			twitterDisplay.namebarStyle = {
				top: 133,
				width: 350,
				fontSize: 25
			};
		}
	};
});

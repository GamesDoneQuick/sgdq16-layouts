/* global define */
define([
	'components/background',
	'components/speedrun',
	'components/compact_nameplates',
	'components/nameplates'
], (setBackground, speedrun, compactNameplates, nameplates) => {
	'use strict';

	const LAYOUT_NAME = '4x3_3';
	const COLUMN_WIDTH = 396;
	const COLUMN_X = 442;
	const sponsorsAndTwitter = document.getElementById('sponsorsAndTwitter');
	const sponsorDisplay = document.querySelector('sponsor-display');
	const twitterDisplay = document.querySelector('twitter-display');

	return {
		attached() {
			setBackground(LAYOUT_NAME);

			speedrun.configure(COLUMN_X, 154, COLUMN_WIDTH, 179, {
				nameY: 17,
				categoryY: 84,
				showEstimate: true,
				nameMaxHeight: 80
			});

			nameplates.disable();

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
					y: 334,
					bottomBorder: true
				}
			]);

			sponsorsAndTwitter.style.top = '412px';
			sponsorsAndTwitter.style.left = `${COLUMN_X}px`;
			sponsorsAndTwitter.style.width = `${COLUMN_WIDTH}px`;
			sponsorsAndTwitter.style.height = '253px';

			sponsorDisplay.orientation = 'vertical';
			sponsorDisplay.style.padding = '30px 30px';

			twitterDisplay.bodyStyle = {
				fontSize: 24,
				top: 50,
				horizontalMargin: 9
			};
			twitterDisplay.namebarStyle = {
				top: 164,
				width: 354,
				fontSize: 26
			};
		},

		detached() {
			compactNameplates.disable();
		}
	};
});

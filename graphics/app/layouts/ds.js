/* global define */
define([
	'components/background',
	'components/speedrun',
	'components/nameplates'
], (setBackground, speedrun, nameplates) => {
	'use strict';

	const LAYOUT_NAME = 'ds';
	const sponsorsAndTwitter = document.getElementById('sponsorsAndTwitter');

	return {
		attached() {
			setBackground(LAYOUT_NAME);

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

			sponsorsAndTwitter.style.display = 'none';
		},

		detached() {
			sponsorsAndTwitter.style.display = 'block';
		}
	};
});

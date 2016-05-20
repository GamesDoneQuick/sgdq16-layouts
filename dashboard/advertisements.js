(function () {
	'use strict';

	const disabledCover = document.getElementById('cover');

	const layoutState = nodecg.Replicant('layoutState');
	layoutState.on('change', newVal => {
		disabledCover.reason = newVal.page;

		if (newVal.page === 'open') {
			disabledCover.reason = null;

			/* When the dashboard first loads, the layout might already be open and have all ads preloaded.
			 * Therefore, on first load we have to ask the layout what the status of all the ads is.
			 * This message will trigger the layout to send `adLoadProgress` or `adLoadFinished` events
			 * for all ads. */
			setTimeout(() => {
				nodecg.sendMessage('getLoadedAds');
			}, 100);
		} else {
			disabledCover.reason = newVal.page;

			if (newVal.page === 'closed') {
				const adItems = Array.from(document.querySelectorAll('ad-item'));
				adItems.forEach(adItem => {
					adItem.percentLoaded = 0;
					adItem.loaded = false;
				});
			}
		}
	});

	/* ----- */

	const playImageButton = document.getElementById('play-image');
	const playVideoButton = document.getElementById('play-video');
	const ftb = nodecg.Replicant('ftb');

	window.checkVideoPlayButton = function () {
		if (!window.playCooldown &&
			window.adListSelectedAd &&
			window.adListSelectedAd.type === 'video' &&
			ftb.value === true) {
			playVideoButton.removeAttribute('disabled');
		} else {
			playVideoButton.setAttribute('disabled', 'true');
		}
	};

	playImageButton.addEventListener('click', playButtonClick);
	playVideoButton.addEventListener('click', playButtonClick);

	/**
	 * Handles the "play" button click events.
	 * @return {undefined}
	 */
	function playButtonClick() {
		// window.adListSelectedAd is set by elements/ad-list.html
		nodecg.sendMessage('playAd', window.adListSelectedAd);

		playImageButton.querySelector('span').innerText = 'Starting playback...';
		playVideoButton.querySelector('span').innerText = 'Starting playback...';
		playImageButton.setAttribute('disabled', 'true');
		playVideoButton.setAttribute('disabled', 'true');

		window.playCooldown = setTimeout(() => {
			window.playCooldown = null;
			playImageButton.removeAttribute('disabled');
			playImageButton.querySelector('span').innerText = 'Play Selected Ad';
			playVideoButton.querySelector('span').innerText = 'Play Selected Ad';
			window.checkVideoPlayButton();
		}, 1000);
	}

	const stopButton = document.getElementById('stop');
	stopButton.addEventListener('click', () => {
		nodecg.sendMessage('stopAd');
	});

	const ftbButton = document.getElementById('ftb');
	ftbButton.addEventListener('click', () => {
		ftb.value = !ftb.value;
	});

	ftb.on('change', newVal => {
		window.checkVideoPlayButton();
		if (newVal) {
			ftbButton.classList.add('nodecg-warning');
			playVideoButton.querySelector('span').innerText = 'Play Selected Ad';
		} else {
			ftbButton.classList.remove('nodecg-warning');
			playVideoButton.querySelector('span').innerText = 'FTB To Play Video';
		}
	});

	/* ----- */

	const imageList = document.getElementById('imageList');
	const videoList = document.getElementById('videoList');
	const imageRegex = /(\.png$)|(\.jpg$)|(\.jpeg$)|(\.gif$)\w+/g;
	const videoRegex = /(\.mp4$)|(\.webm$)\w+/g;
	nodecg.Replicant('assets:advertisements').on('change', newVal => {
		imageList.ads = newVal.filter(ad => {
			return imageRegex.test(ad.ext);
		});

		videoList.ads = newVal.filter(ad => {
			return videoRegex.test(ad.ext);
		});
	});

	nodecg.listenFor('adLoadProgress', data => {
		const el = document.querySelector(`ad-item[filename="${data.filename}"]`);
		if (el) {
			el.percentLoaded = data.percentLoaded;
		}
	});

	nodecg.listenFor('adLoaded', filename => {
		const el = document.querySelector(`ad-item[filename="${filename}"]`);
		if (el) {
			el.loaded = true;
		}
	});

	/* ----- */

	const adState = nodecg.Replicant('adState');
	const status = document.getElementById('status');
	adState.on('change', newVal => {
		switch (newVal) {
			case 'stopped':
				status.innerText = 'Not currently playing an ad.';
				status.style.fontWeight = 'normal';
				break;
			case 'playing':
				status.innerText = 'An ad is in progress.';
				status.style.fontWeight = 'bold';
				break;
			default:
				throw new Error(`Unexpected adState: "${newVal}"`);
		}
	});
})();

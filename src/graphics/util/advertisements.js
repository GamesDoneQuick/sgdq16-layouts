'use strict';

const SLIDE_DURATION = 1.5;
const FADE_DURATION = 0.5;
const FADE_EASE = Power1.easeInOut;
const IMAGE_AD_DURATION = 30;
const Stage = require('../classes/Stage');
const debug = require('./debug');
const loader = new createjs.LoadQueue();

/* ----- */

const adState = nodecg.Replicant('adState');

nodecg.readReplicant('ads', value => {
	value.forEach(loadAd);
});

nodecg.listenFor('adRemoved', ad => {
	debug.log('[advertisements] Removing %s', ad.filename);
	loader.remove(`ad-${ad.filename}`);
});

nodecg.listenFor('adChanged', ad => {
	debug.log('[advertisements] Reloading %s', ad.filename);
	loader.remove(`ad-${ad.filename}`);
	loadAd(ad);
});

nodecg.listenFor('newAd', loadAd);

nodecg.listenFor('getLoadedAds', () => {
	loader.getItems(false).forEach(item => {
		if (item.result && item.item.gdqType === 'ad') {
			nodecg.sendMessage('adLoaded', item.item.gdqFilename);
		}
	});
});

loader.on('fileprogress', e => {
	if (e.item.gdqType !== 'ad') {
		return;
	}

	nodecg.sendMessage('adLoadProgress', {
		filename: e.item.gdqFilename,
		percentLoaded: e.loaded * 100
	});
});

loader.on('fileload', e => {
	if (e.item.gdqType !== 'ad') {
		return;
	}
	nodecg.sendMessage('adLoaded', e.item.gdqFilename);
});

/* ----- */

const ftbCover = document.getElementById('ftbCover');
const ftb = nodecg.Replicant('ftb');
ftb.on('change', newVal => {
	if (newVal) {
		TweenLite.to(ftbCover, FADE_DURATION, {
			opacity: 1,
			ease: FADE_EASE,
			onComplete() {
				Stage.globalPause = true;
			}
		});
	} else {
		TweenLite.to(ftbCover, FADE_DURATION, {
			onStart() {
				Stage.globalPause = false;
			},
			opacity: 0,
			ease: FADE_EASE
		});
	}
});

/* ----- */

const tl = new TimelineLite({autoRemoveChildren: true});
const container = document.getElementById('container');
const imageContainer = document.getElementById('imageAdContainer');
let currentImage;
let nextImage;

nodecg.listenFor('stopAd', () => {
	adState.value = 'stopped';
	tl.clear();
	tl.to(imageContainer, SLIDE_DURATION, {
		x: -1280,
		roundProps: 'x',
		ease: Power2.easeIn,
		onComplete: removeAdImages
	});
	removeAdVideo();
});

// We assume that if we're hearing this message then the ad in question is fully preloaded.
nodecg.listenFor('playAd', ad => {
	const result = loader.getResult(`ad-${ad.filename}`);
	if (ad.type === 'image') {
		if (result) {
			showAdImage(result);
			nodecg.sendMessage('logAdPlay', ad);
		} else {
			throw new Error(`Tried to play ad but ad was not preloaded: ${ad.filename}`);
		}
	} else if (ad.type === 'video') {
		if (result) {
			showAdVideo(result);
			nodecg.sendMessage('logAdPlay', ad);
		} else {
			throw new Error(`Tried to play ad but ad was not preloaded: ${ad.filename}`);
		}
	} else {
		throw new Error(`[advertisements] Unexpected ad type: "${ad.type}"`);
	}
});

/* ----- */

/**
 * Loads an advertisement.
 * @param {Object} ad - An ad descriptor object.
 * @returns {undefined}
 */
function loadAd(ad) {
	debug.log('[advertisements] Loading %s', ad.filename);
	const preloadType = ad.type === 'video' ? createjs.AbstractLoader.VIDEO : createjs.AbstractLoader.IMAGE;
	loader.loadFile({
		id: `ad-${ad.filename}`,
		src: ad.url,
		gdqType: 'ad',
		gdqFilename: ad.filename,
		type: preloadType
	});
}

/**
 * Shows an image advertisement.
 * @param {HTMLElement} img - The next <img> tag to show.
 * @returns {undefined}
 */
function showAdImage(img) {
	// If the new ad is the same as the old one, do nothing.
	if (currentImage === img) {
		debug.log('[advertisements] New img is identical to current image, aborting.');
		return;
	}

	// Clear any existing tweens. Advertisements ain't nothin' to fuck wit.
	tl.clear();
	removeAdVideo();
	tl.add('start');

	// If we already have a next image, ???
	if (nextImage) {
		throw new Error('[advertisements] We\'ve already got a next image queued up, you\'re screwed.');
	}

	// If there is an existing image being displayed, we need to crossfade to the new image.
	// Else, just slide the imageContainer in.
	if (currentImage) {
		nextImage = img;
		nextImage.style.opacity = 0;
		imageContainer.appendChild(nextImage);

		tl.to(nextImage, FADE_DURATION, {
			opacity: 1,
			ease: FADE_EASE,
			onComplete() {
				imageContainer.removeChild(currentImage);
				currentImage = nextImage;
				nextImage = null;
			}
		}, 'start');
	} else {
		currentImage = img;
		imageContainer.appendChild(currentImage);

		tl.to(imageContainer, SLIDE_DURATION, {
			onStart() {
				currentImage.style.opacity = 1;
				adState.value = 'playing';
			},
			x: 0,
			roundProps: 'x',
			ease: Power2.easeOut
		}, 'start');
	}

	// Slide out after FADE_DURATION seconds.
	tl.to(imageContainer, SLIDE_DURATION, {
		x: -1280,
		roundProps: 'x',
		ease: Power2.easeIn,
		onComplete() {
			adState.value = 'stopped';
			removeAdImages();
		}
	}, `start+=${IMAGE_AD_DURATION + FADE_DURATION}`);
}

/**
 * Removes all image ads from the DOM.
 * @returns {undefined}
 */
function removeAdImages() {
	if (currentImage) {
		imageContainer.removeChild(currentImage);
		currentImage = null;
	}

	if (nextImage) {
		imageContainer.removeChild(nextImage);
		nextImage = null;
	}
}

/**
 * Shows a video advertisement.
 * @param {HTMLElement} video - The <video> tag to play.
 * @returns {undefined}
 */
function showAdVideo(video) {
	video.removeEventListener('playing', playingListener);
	video.removeEventListener('ended', endedListener);

	removeAdVideo();
	removeAdImages();

	video.currentTime = 0;
	video.style.visibility = 'hidden';
	video.id = 'videoPlayer';
	video.classList.add('fullscreen');
	video.play();

	// The videos sometimes look at bit weird when they first start playing.
	// To polish things up a bit, we hide the video until the 'playing' event is fired.
	video.addEventListener('playing', playingListener);

	// When the video ends, remove it from the page.
	video.addEventListener('ended', endedListener);

	container.appendChild(video);
}

/**
 * Removes all ad videos from the DOM.
 * @returns {undefined}
 */
function removeAdVideo() {
	while (document.getElementById('videoPlayer')) {
		container.removeChild(document.getElementById('videoPlayer'));
	}
}

/**
 * Makes a video visible once it's started playing.
 * @returns {undefined}
 */
function playingListener() {
	this.style.visibility = 'visible';
	this.removeEventListener('playing', playingListener);
	adState.value = 'playing';
}

/**
 * Removes a video element from the DOM once it's stopped playing.
 * @returns {undefined}
 */
function endedListener() {
	removeAdVideo();
	this.removeEventListener('ended', endedListener);
	adState.value = 'stopped';
}

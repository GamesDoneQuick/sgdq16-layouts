'use strict';

const STAGE_WIDTH = 371;
const STAGE_HEIGHT = 330;
const DESCRIPTION_HEIGHT = 53;
const Stage = require('./classes/stage');
const Layout = require('./classes/layout');
const globals = require('./util/globals');
const nowPlaying = document.querySelector('now-playing');
const sponsorsAndTwitter = document.getElementById('sponsorsAndTwitter');
const sponsorDisplay = document.querySelector('sponsor-display');
const twitterDisplay = document.querySelector('twitter-display');

const stage = new Stage(STAGE_WIDTH, STAGE_HEIGHT, 'break-prizes');
stage.canvas.style.top = '308px';
stage.canvas.style.right = '0px';
stage.canvas.style.backgroundColor = 'black';

// Start hidden
stage.visible = false;
stage.paused = true;
stage.canvas.style.display = 'none';

/* ----- */

const labelContainer = new createjs.Container();
labelContainer.x = STAGE_WIDTH - 203;

const labelBackground = new createjs.Shape();
labelBackground.graphics.beginFill('#00aeef').drawRect(0, 0, 203, 27);
labelBackground.alpha = 0.78;

const labelText = new createjs.Text('RAFFLE PRIZES', '800 24px proxima-nova', 'white');
labelText.x = 14;
labelText.y = 0;

labelContainer.addChild(labelBackground, labelText);
labelContainer.cache(0, 0, 203, 27);

/* ----- */

const descriptionContainer = new createjs.Container();
descriptionContainer.y = STAGE_HEIGHT - DESCRIPTION_HEIGHT;

const descriptionBackground = new createjs.Shape();
descriptionBackground.graphics.beginFill('#00aeef').drawRect(0, 0, STAGE_WIDTH, DESCRIPTION_HEIGHT);
descriptionBackground.alpha = 0.73;

const descriptionText = new createjs.Text('', '800 22px proxima-nova', 'white');
descriptionText.x = 8;
descriptionText.y = 3;
descriptionText.lineWidth = STAGE_WIDTH - descriptionText.x * 2;

descriptionContainer.addChild(descriptionBackground, descriptionText);

/* ----- */

const currentImage = new createjs.Bitmap();
const nextImage = new createjs.Bitmap();
stage.addChild(currentImage, nextImage, labelContainer, descriptionContainer);

/* ----- */

const TRANSITION_DURATION = 1.2;
const DESCRIPTION_TRANSITION_DURATON = TRANSITION_DURATION / 2 - 0.1;

const preloadedImages = {};
const tl = new TimelineMax({repeat: -1});
globals.currentPrizesRep.on('change', newVal => {
	tl.clear();
	newVal.forEach(showPrize);
});

/**
 * Queues an animation to show a prize.
 * @param {Object} prize - The prize to show.
 * @returns {undefined}
 */
function showPrize(prize) {
	let imgEl;
	if (preloadedImages[prize.name]) {
		imgEl = preloadedImages[prize.name];
	} else {
		imgEl = document.createElement('img');
		imgEl.src = prize.image;
		preloadedImages[prize.name] = imgEl;
	}

	tl.call(() => {
		nextImage.x = STAGE_WIDTH;
		nextImage.image = imgEl;
		if (!imgEl.complete) {
			tl.pause();
			imgEl.addEventListener('load', () => tl.play());
		}
	}, null, null, '+=0.1');

	tl.add('prizeEnter');

	tl.to(currentImage, TRANSITION_DURATION, {
		x: -STAGE_WIDTH,
		ease: Power2.easeInOut
	}, 'prizeEnter');

	tl.to(nextImage, TRANSITION_DURATION, {
		x: 0,
		ease: Power2.easeInOut,
		onComplete() {
			currentImage.image = imgEl;
			currentImage.x = 0;
			nextImage.x = STAGE_WIDTH;
		}
	}, 'prizeEnter');

	tl.to(descriptionContainer, DESCRIPTION_TRANSITION_DURATON, {
		y: STAGE_HEIGHT,
		ease: Power2.easeIn,
		onComplete() {
			descriptionText.text = prize.description;
			descriptionContainer.cache(0, 0, STAGE_WIDTH, DESCRIPTION_HEIGHT);
		}
	}, 'prizeEnter');

	tl.to(descriptionContainer, DESCRIPTION_TRANSITION_DURATON, {
		y: STAGE_HEIGHT - DESCRIPTION_HEIGHT,
		ease: Power2.easeOut
	}, `-=${DESCRIPTION_TRANSITION_DURATON}`);

	tl.to({}, globals.displayDuration, {});
}

module.exports = new Layout('break', () => {
	const speedrun = require('./components/speedrun');
	const nameplates = require('./components/nameplates');

	speedrun.disable();
	nameplates.disable();
	stage.visible = true;
	stage.paused = false;
	stage.canvas.style.display = 'block';

	nowPlaying.style.display = 'flex';

	sponsorsAndTwitter.style.top = '479px';
	sponsorsAndTwitter.style.left = '387px';
	sponsorsAndTwitter.style.width = '516px';
	sponsorsAndTwitter.style.height = '146px';

	sponsorDisplay.style.display = 'none';

	twitterDisplay.style.zIndex = '-1';
	twitterDisplay.bodyStyle = {
		fontSize: 21,
		top: 15,
		horizontalMargin: 13
	};
	twitterDisplay.namebarStyle = {
		top: 98,
		width: 305,
		fontSize: 20
	};
});

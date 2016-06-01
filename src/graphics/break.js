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

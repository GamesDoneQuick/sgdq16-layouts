'use strict';

const STAGE_WIDTH = 1280;
const STAGE_HEIGHT = 100;
const PADDING = 37;
const debug = require('./util/debug');
const Stage = require('./classes/stage');
const Layout = require('./classes/layout');
const sponsorsAndTwitter = document.getElementById('sponsorsAndTwitter');
const sponsorDisplay = document.querySelector('sponsor-display');
const twitterDisplay = document.querySelector('twitter-display');

const stage = new Stage(STAGE_WIDTH, STAGE_HEIGHT, 'interview-lowerthird');
stage.canvas.style.top = '502px';
stage.canvas.style.left = '0px';

// Start hidden
stage.visible = false;
stage.paused = true;
stage.canvas.style.display = 'none';

/* ----- */

const background = new createjs.Shape();
background.y = STAGE_HEIGHT / 2;
stage.addChild(background);

const backgroundLayer4 = background.graphics.beginFill('#0075a1').drawRect(0, 0, STAGE_WIDTH, 0).command;
backgroundLayer4.targetHeight = 74;

const backgroundLayer3 = background.graphics.beginFill('#00aeef').drawRect(0, 0, STAGE_WIDTH, 0).command;
backgroundLayer3.targetHeight = 66;

const backgroundLayer2 = background.graphics.beginFill('#0075a1').drawRect(0, 0, STAGE_WIDTH, 0).command;
backgroundLayer2.targetHeight = 62;

const backgroundLayer1 = background.graphics.beginFill('#00aeef').drawRect(0, 0, STAGE_WIDTH, 0).command;
backgroundLayer1.targetHeight = 58;

const backgroundLayers = [backgroundLayer1, backgroundLayer2, backgroundLayer3, backgroundLayer4];
const reverseBackgroundLayers = backgroundLayers.slice(0).reverse();

/* ----- */

const textContainer = new createjs.Container();
textContainer.y = 36;
textContainer.mask = background;
stage.addChild(textContainer);

const nameText1 = new createjs.Text('', '800 25px proxima-nova', 'white');
const nameText2 = new createjs.Text('', '800 25px proxima-nova', 'white');
const nameText3 = new createjs.Text('', '800 25px proxima-nova', 'white');
const nameText4 = new createjs.Text('', '800 25px proxima-nova', 'white');

nameText1.textAlign = 'center';
nameText2.textAlign = 'center';
nameText3.textAlign = 'center';
nameText4.textAlign = 'center';

textContainer.addChild(nameText1, nameText2, nameText3, nameText4);

/* ----- */

const interviewNames = nodecg.Replicant('interviewNames');
const tl = new TimelineLite({autoRemoveChildren: true});

nodecg.Replicant('interviewLowerthirdShowing').on('change', newVal => {
	if (newVal) {
		tl.call(() => {
			const names = interviewNames.value;
			const numNames = names.filter(s => Boolean(s)).length;
			const maxWidth = (STAGE_WIDTH / numNames) - (PADDING * 2);
			nameText1.maxWidth = maxWidth;
			nameText2.maxWidth = maxWidth;
			nameText3.maxWidth = maxWidth;
			nameText4.maxWidth = maxWidth;

			nameText1.text = names[0] ? names[0].toUpperCase() : '';
			nameText2.text = names[1] ? names[1].toUpperCase() : '';
			nameText3.text = names[2] ? names[2].toUpperCase() : '';
			nameText4.text = names[3] ? names[3].toUpperCase() : '';

			const widthUnit = STAGE_WIDTH / numNames;
			names.forEach((name, index) => {
				textContainer.children[index].x = (widthUnit * index) + (widthUnit / 2);
			});
		}, null, null, '+=0.1');

		tl.add('entry');

		reverseBackgroundLayers.forEach((rect, index) => {
			tl.to(rect, 1, {
				h: rect.targetHeight,
				roundProps: index === 0 ? 'h' : '', // Round the outermost rect
				ease: Elastic.easeOut.config(0.5, 0.5),
				onStart() {
					if (index === 0) {
						debug.time('interviewEnter');
					}
				},
				onUpdate() {
					// Round the outermost rect to avoid half pixels which can't be cleanly chroma keyed
					rect.y = index === 0 ? -Math.round(rect.h / 2) : -(rect.h / 2);
				},
				onComplete() {
					if (index === 3) {
						debug.timeEnd('interviewEnter');
					}
				}
			}, `entry+=${index * 0.08}`);
		});
	} else {
		tl.add('exit');

		backgroundLayers.forEach((rect, index) => {
			tl.to(rect, 1, {
				h: 0,
				roundProps: index === 3 ? 'h' : '',
				ease: Back.easeIn.config(1.3),
				onStart() {
					if (index === 0) {
						debug.time('interviewExit');
					}
				},
				onUpdate() {
					rect.y = index === 3 ? -Math.round(rect.h / 2) : -(rect.h / 2);
				},
				onComplete() {
					if (index === 3) {
						debug.timeEnd('interviewExit');
					}
				}
			}, `exit+=${index * 0.08}`);
		});
	}
});

module.exports = new Layout('interview', () => {
	const speedrun = require('./components/speedrun');
	const nameplates = require('./components/nameplates');

	speedrun.disable();
	nameplates.disable();
	stage.visible = true;
	stage.paused = false;
	stage.canvas.style.display = 'block';

	sponsorsAndTwitter.style.top = '356px';
	sponsorsAndTwitter.style.left = '764px';
	sponsorsAndTwitter.style.width = '516px';
	sponsorsAndTwitter.style.height = '146px';

	sponsorDisplay.style.display = 'none';

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

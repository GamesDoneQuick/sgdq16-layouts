'use strict';

const AUDIO_ICON_WIDTH = 36;
const AUDIO_ICON_HEIGHT = 36;
const WIDTH = 396;
const HEIGHT = 76;
const NAME_RECT_HEIGHT = 35;
const NAME_RECT_WIDTH = 331;
const debounce = require('lodash.debounce');
const loader = require('../util/loader');
const globals = require('../util/globals');
const Stage = require('./stage');

/**
 * Creates a new CompactNameplate instance.
 * @constructor
 * @param {Number} index - Which runner index to pull data for (0-3).
 * @param {String} [alignment="left"] - Which side to align to ('left' or 'right').
 * @extends createjs.Container
 */
function CompactNameplate(index, alignment = 'left') {
	/* eslint-disable babel/new-cap */
	this.Container_constructor();
	this.setup(index, alignment);
	/* eslint-enable babel/new-cap */
}

const p = createjs.extend(CompactNameplate, createjs.Container);

p.setup = function (index, alignment) {
	const stage = new Stage(WIDTH, 167); // Extra height to hit 256x257 minimum for hardware acceleration
	stage.canvas.style.left = '442px';
	stage.canvas.classList.add('nameplate', 'compact');

	/* ----- */

	this.coverMask = new createjs.Shape();
	this.coverMask.graphics.drawRect(0, 0, NAME_RECT_WIDTH, NAME_RECT_HEIGHT);

	this.cover1 = new createjs.Shape();
	this.cover1.graphics.beginFill('#6fd8ff');
	this.cover1Rect = this.cover1.graphics.drawRect(0, 0, 0, NAME_RECT_HEIGHT).command;
	this.cover1.mask = this.coverMask;

	this.cover2 = new createjs.Shape();
	this.cover2.graphics.beginFill('white');
	this.cover2Rect = this.cover2.graphics.drawRect(0, 0, 0, NAME_RECT_HEIGHT).command;
	this.cover2.mask = this.coverMask;

	/* ----- */

	this.nameBackground = new createjs.Shape();
	this.nameBackgroundFill = this.nameBackground.graphics.beginFill('#0072bc').command;
	this.nameBackground.graphics.drawRect(0, 0, NAME_RECT_WIDTH, NAME_RECT_HEIGHT);

	this.nameText = new createjs.Text('', '900 28px proxima-nova', 'white');
	this.nameText.y = 1;
	this.nameText.maxWidth = 308;

	/* ----- */

	this.twitchContainer = new createjs.Container();

	this.twitchBackground = new createjs.Shape();
	this.twitchBackground.graphics.beginFill('#985da6');
	this.twitchBackgroundRect = this.twitchBackground.graphics.drawRect(0, 0, 322, NAME_RECT_HEIGHT).command;
	this.twitchBackground.skewX = -10;

	this.twitchIcon = new createjs.Bitmap(loader.queue.getResult('nameplate-twitch-logo'));
	this.twitchIcon.y = 6;
	this.twitchIcon.scaleY = 23 / this.twitchIcon.getBounds().height;
	this.twitchIcon.scaleX = 23 / this.twitchIcon.getBounds().height;
	this.twitchIcon.mask = this.twitchBackground;

	this.twitchText = new createjs.Text('', '900 28px proxima-nova', 'white');
	this.twitchText.y = 1;
	this.twitchText.maxWidth = 270;

	this.twitchContainer.addChild(this.twitchBackground, this.twitchIcon, this.twitchText);
	this.twitchContainer.visible = false;

	/* ----- */

	this.timeText = new createjs.Text('0:00:00', '900 30px proxima-nova', 'white');
	this.timeText.y = 37;

	this.placeText = new createjs.Text('', '900 30px proxima-nova', '#fed206');
	this.placeText.y = this.timeText.y;

	/* ----- */

	this.audioIcon = new createjs.Bitmap(loader.queue.getResult('nameplate-audio-on'));
	this.audioIcon.regX = AUDIO_ICON_WIDTH / 2;
	this.audioIcon.regY = AUDIO_ICON_HEIGHT / 2;
	this.audioIconColorFilter = new createjs.ColorFilter(0, 0, 0);
	this.audioIcon.y = HEIGHT / 2;

	/* ----- */

	this.bottomBorder = new createjs.Shape();
	this.bottomBorder.y = HEIGHT;
	this.bottomBorderRect = this.bottomBorder.graphics.beginFill('white').drawRect(0, 0, WIDTH, 2).command;

	/* ----- */

	this.background = new createjs.Shape();
	this.backgroundFill = this.background.graphics.beginFill('#00AEEF').command;
	this.background.graphics.drawRect(0, 0, WIDTH, HEIGHT);

	this.addChild(this.background, this.nameBackground, this.nameText, this.timeText, this.placeText,
		this.twitchContainer, this.audioIcon, this.bottomBorder, this.cover1, this.cover2);
	stage.addChild(this);

	/* ----- */

	this.alignment = alignment;
	if (alignment === 'right') {
		this.nameBackground.x = 65;

		this.nameText.textAlign = 'right';
		this.nameText.x = WIDTH - 5;

		this.twitchIcon.x = WIDTH - 30;

		this.twitchText.textAlign = 'right';
		this.twitchText.x = WIDTH - 38;

		this.twitchBackground.skewX = 10;
		this.twitchBackground.scaleX = -1;
		this.twitchBackground.x = WIDTH + 10;

		this.timeText.textAlign = 'right';
		this.timeText.x = this.nameText.x;

		this.placeText.textAlign = 'right';

		this.audioIcon.x = (WIDTH - NAME_RECT_WIDTH) / 2;

		this.cover1.scaleX = -1;
		this.cover1.x = WIDTH;
		this.cover2.scaleX = -1;
		this.cover2.x = WIDTH;
		this.coverMask.scaleX = -1;
		this.coverMask.x = WIDTH;
	} else {
		this.nameText.x = 5;

		this.twitchIcon.x = 8;

		this.twitchText.x = 38;

		this.twitchBackground.x = -10;

		this.timeText.x = this.nameText.x;

		this.audioIcon.x = NAME_RECT_WIDTH + (WIDTH - NAME_RECT_WIDTH) / 2;
	}

	this.twitchTl = new TimelineMax({repeat: -1});
	const twitchHideX = this.alignment === 'right' ? 322 : -322;
	this.twitchContainer.x = twitchHideX;
	this.twitchContainer.visible = true;

	this.twitchTl = new TimelineMax({repeat: -1});

	this.twitchTl.to({}, 90, {});

	this.twitchTl.to(this.twitchContainer, 1.2, {
		x: 0,
		ease: Power2.easeInOut
	});

	this.twitchTl.to(this.twitchContainer, 0.9, {
		x: twitchHideX,
		ease: Power2.easeIn
	}, '+=8.5');

	if (this.twitchText.text) {
		this.restartTwitchTimeline();
	}

	/* ----- */

	const handleRunnerChange = debounce((name, stream) => {
		const tl = new TimelineLite();

		tl.add('enter');

		tl.to(this.cover1Rect, 0.33, {
			w: NAME_RECT_WIDTH,
			ease: Power3.easeInOut,
			onComplete: function () {
				this.nameText.text = name;
				this.twitchText.text = stream;

				if (stream) {
					this.restartTwitchTimeline();
				} else {
					this.twitchTl.seek(0);
					this.twitchTl.pause();
					this.twitchContainer.visible = false;
				}
			}.bind(this)
		}, 'enter');

		tl.to(this.cover2Rect, 0.77, {
			w: NAME_RECT_WIDTH,
			ease: Power3.easeInOut
		}, 'enter');

		tl.add('exit', '-=0.15');

		tl.to(this.cover2Rect, 0.33, {
			x: NAME_RECT_WIDTH,
			ease: Power3.easeInOut
		}, 'exit');

		tl.to(this.cover1Rect, 0.77, {
			x: NAME_RECT_WIDTH,
			ease: Power3.easeInOut
		}, 'exit');

		tl.call(() => {
			this.cover1Rect.x = 0;
			this.cover1Rect.w = 0;
			this.cover2Rect.x = 0;
			this.cover2Rect.w = 0;
		});
	}, 1500);

	globals.currentRunRep.on('change', newVal => {
		const runner = newVal.runners[index];
		if (runner) {
			handleRunnerChange(runner.name, runner.stream);
		} else {
			handleRunnerChange('?', '?');
		}
	});

	globals.stopwatchesRep.on('change', newVal => {
		const stopwatch = newVal[index];
		this.timeText.text = stopwatch.time;
		this.placeText.text = '';
		this.timeText.color = 'white';
		this.backgroundFill.style = '#00AEEF';
		this.nameBackgroundFill.style = '#0072bc';

		switch (stopwatch.state) {
			case 'paused':
				this.timeText.color = '#007c9e';
				break;
			case 'finished':
				this.backgroundFill.style = '#60bb46';
				this.nameBackgroundFill.style = '#3c9143';

				switch (stopwatch.place) {
					case 1:
						this.placeText.text = '1st';
						break;
					case 2:
						this.placeText.text = '2nd';
						break;
					case 3:
						this.placeText.text = '3rd';
						break;
					case 4:
						this.placeText.text = '4th';
						break;
					default:
						throw new Error(`[compact_nameplate] Unexpected stopwatch finish place: "${stopwatch.place}"`);
				}

				if (alignment === 'right') {
					this.timeText.text = ` - ${this.timeText.text}`;
					this.placeText.x = this.timeText.x - this.timeText.getBounds().width;
				} else {
					this.timeText.text += ' - ';
					this.placeText.x = this.timeText.x + this.timeText.getBounds().width;
				}

				break;
			default:
			// Do nothing.
		}
	});

	globals.gameAudioChannelsRep.on('change', newVal => {
		const channels = newVal[index];
		const canHearSd = !channels.sd.muted && !channels.sd.fadedBelowThreshold;
		const canHearHd = !channels.hd.muted && !channels.hd.fadedBelowThreshold;
		if (canHearSd || canHearHd) {
			if (!this.audioIcon.filters) {
				return;
			}

			this.audioIcon.filters = null;
			this.audioIcon.alpha = 1;
			this.audioIcon.image = preloader.getResult('nameplate-audio-on');
			this.audioIcon.uncache();
		} else {
			if (this.audioIcon.filters && this.audioIcon.filters.length > 0) {
				return;
			}

			this.audioIcon.image = preloader.getResult('nameplate-audio-off');
			this.audioIcon.filters = [this.audioIconColorFilter];
			this.audioIcon.alpha = 0.08;
			this.audioIcon.cache(0, 0, AUDIO_ICON_WIDTH, AUDIO_ICON_HEIGHT);
		}
	});
};

p.configure = function (opts) {
	this.stage.canvas.style.top = '${opts.y}px';
	this.bottomBorder.visible = opts.bottomBorder;
};

p.restartTwitchTimeline = function () {
	this.twitchTl.seek(0);
	this.twitchTl.play();
};

p.disable = function () {
	this.stage.visible = false;
	this.stage.paused = true;
	this.stage.canvas.style.display = 'none';
};

p.enable = function () {
	this.stage.visible = true;
	this.stage.paused = false;
	this.stage.canvas.style.display = 'block';
};

module.exports = createjs.promote(CompactNameplate, 'Container');

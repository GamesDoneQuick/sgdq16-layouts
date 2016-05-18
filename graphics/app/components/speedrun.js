/* global define, requirejs, TimelineLite, Power1, Linear */
define([
	'preloader',
	'globals',
	'classes/stage',
	'debug'
], (preloader, globals, Stage, debug) => {
	'use strict';

	const BOXART_WIDTH = 469;
	const BOXART_ASPECT_RATIO = 1.397;
	const BOXART_SCROLL_TIME = 30;
	const BOXART_FADE_TIME = 2;

	// We'll be changing these every time we switch to a new layout.
	// The "g" here means "Global". IDK, just some way of signifying these vars are permanent.
	/* eslint-disable one-var */
	let gWidth, gHeight, gOpts, gBoxartImage, boxartHeight;
	/* eslint-enable one-var */

	const createjs = requirejs('easel');
	const stage = new Stage(0, 0, 'speedrun');
	const shadow = new createjs.Shadow('black', 2, 2, 0);

	/* ----- */

	const boxartContainer1 = new createjs.Container();
	const boxartContainer2 = new createjs.Container();

	const color1 = new createjs.Shape();
	const color2 = new createjs.Shape();

	const boxart1 = new createjs.Bitmap();
	boxart1.alpha = 0.3;
	boxart1.compositeOperation = 'luminosity';
	const boxart2 = boxart1.clone();

	boxartContainer1.addChild(color1, boxart1);
	boxartContainer2.addChild(color2, boxart2);

	/* ----- */

	const name = new createjs.Text('', '800 29px proxima-nova', 'white');
	name.textAlign = 'end';
	name.shadow = shadow;

	/* ----- */

	const categoryContainer = new createjs.Container();
	categoryContainer.x = -2; // Hide the left stroke

	const category = new createjs.Text('', '600 18px proxima-nova', 'black');
	category.x = 34;
	category.y = 4;

	const categoryBoxart = new createjs.Shape();
	categoryBoxart.graphics
		.beginStroke('#0075a1')
		.beginFill('white')
		.drawRect(0, 0, 0, 31);
	const categoryRect = categoryBoxart.graphics.command;

	categoryContainer.addChild(categoryBoxart, category);

	/* ----- */

	const estimateContainer = new createjs.Container();

	const estimate = new createjs.Text('', '600 18px proxima-nova', 'black');
	estimate.textAlign = 'right';
	estimate.y = 4;

	const estimateBoxart = new createjs.Shape();
	estimateBoxart.graphics
		.beginStroke('#0075a1')
		.beginFill('white')
		.drawRect(0, 0, 0, 31);
	const estimateRect = estimateBoxart.graphics.command;

	estimateContainer.addChild(estimateBoxart, estimate);
	window.estimateContainer = estimateContainer;

	/* ----- */

	const consoleBitmap = new createjs.Bitmap();

	/* ----- */

	const foreground = new createjs.Container();
	foreground.addChild(name, categoryContainer, estimateContainer, consoleBitmap);

	/* ----- */

	const stageMask = new createjs.Shape();
	const stageMaskRect = stageMask.graphics.drawRect(0, 0, 0, 0).command;
	stage.mask = stageMask;
	stage.addChild(boxartContainer1, boxartContainer2, foreground);

	/**
	 *  Re-caches the foreground elements (name, console icon, estimate, category)
	 */
	function recacheForeground() {
		foreground.cache(0, 0, gWidth, gHeight);
	}

	let showingBoxart = boxartContainer1;
	let hiddenBoxart = boxartContainer2;
	let currentBoxartScrollTl;
	let boxartScrollInterval;

	/**
	 *  Does one iteration of the boxart scroll animation.
	 */
	function boxartScroll() {
		const tl = new TimelineLite();
		currentBoxartScrollTl = tl;

		tl.fromTo(showingBoxart, BOXART_SCROLL_TIME + BOXART_FADE_TIME,
			{y: 0},
			{
				immediateRender: false,
				y: gHeight - boxartHeight,
				ease: Linear.easeNone
			}
		);

		tl.add('crossfade', BOXART_SCROLL_TIME);
		tl.to(showingBoxart, BOXART_FADE_TIME, {
			onStart() {
				debug.time('boxartCrossfade');
			},
			alpha: 0,
			ease: Power1.easeInOut,
			onComplete(boxartWeJustHid) {
				if (boxartWeJustHid.image !== gBoxartImage) {
					recacheBoxartAfterImageLoad(boxartWeJustHid);
				}
			},
			onCompleteParams: [showingBoxart]
		}, 'crossfade');
		tl.to(hiddenBoxart, BOXART_FADE_TIME, {
			alpha: 1,
			ease: Power1.easeInOut,
			onComplete() {
				debug.timeEnd('boxartCrossfade');
			}
		}, 'crossfade');

		const tmp = showingBoxart;
		showingBoxart = hiddenBoxart;
		hiddenBoxart = tmp;
	}

	/**
	 *  Waits for the boxart image to be fully loaded, then redraws both boxart elements.
	 */
	// TODO: Figure out if the "after image load" part is still necessary now that I'm using base64 images.
	function recacheBoxartAfterImageLoad(boxartContainer) {
		const bitmap = boxartContainer.children[1];
		if (!bitmap.image) {
			return;
		}

		bitmap.image = gBoxartImage;
		if (bitmap.image.complete) {
			cacheBoxartContainer(boxartContainer);
		} else {
			bitmap.image.addEventListener('load', () => {
				cacheBoxartContainer(boxartContainer);
			});
		}
	}

	function cacheBoxartContainer(boxartContainer) {
		boxartContainer.cache(0, 0, gWidth, Math.ceil(boxartHeight));
	}

	function reformatBoxart() {
		boxartHeight = gWidth * BOXART_ASPECT_RATIO;
		boxart1.scaleX = boxart2.scaleX = gWidth / BOXART_WIDTH;
		boxart1.scaleY = boxart2.scaleY = gWidth / BOXART_WIDTH;
		color1.graphics.clear().beginFill('#00ADEF').drawRect(0, 0, gWidth, boxartHeight);
		color2.graphics.clear().beginFill('#00ADEF').drawRect(0, 0, gWidth, boxartHeight);

		// Caching seems to have no discernible performance benefit in this particular case,
		// and in OBS1 CLR Browser Sources actually seems to make performance far worse.
		boxart1.image = gBoxartImage;
		boxart2.image = gBoxartImage;
		cacheBoxartContainer(boxartContainer1);
		cacheBoxartContainer(boxartContainer2);

		// Reset the scroll
		clearInterval(boxartScrollInterval);
		if (currentBoxartScrollTl) {
			currentBoxartScrollTl.clear();
		}

		showingBoxart.alpha = 1;
		hiddenBoxart.alpha = 0;

		boxartScroll();
		boxartScrollInterval = setInterval(boxartScroll, BOXART_SCROLL_TIME * 1000);
	}

	function calcAndSetNameStyle() {
		if (typeof gOpts === 'undefined') {
			return;
		}

		name.scaleX = name.scaleY = gOpts.scale;

		if (name.text.indexOf('\n') >= 0) {
			name.regY = 8;
			name.textBaseline = 'top';
			name.y = gOpts.nameY;
		} else {
			name.regY = 0;
			name.textBaseline = 'middle';

			const maxWidth = gWidth - (gWidth * 0.12);
			const nameBounds = name.getTransformedBounds();
			let nameScalar = maxWidth / nameBounds.width;

			if (nameBounds.height * nameScalar > gOpts.nameMaxHeight) {
				nameScalar = gOpts.nameMaxHeight / nameBounds.height;
			}

			name.scaleX = name.scaleY *= nameScalar;
			name.y = (gOpts.nameY + (gOpts.categoryY - gOpts.nameY) / 2);
		}
	}

	function repositionConsole() {
		if (!gOpts) {
			return;
		}

		const bounds = consoleBitmap.getBounds();
		consoleBitmap.regY = (bounds.height - 4) / 2;

		if (gOpts.showEstimate) {
			consoleBitmap.regX = 0;
			consoleBitmap.x = 8;
			consoleBitmap.y = estimateContainer.y + (estimateContainer.getBounds().height - 2) / 2;
		} else {
			consoleBitmap.regX = consoleBitmap.getBounds().width;
			consoleBitmap.x = gWidth - 8;
			consoleBitmap.y = categoryContainer.y + (categoryContainer.getBounds().height - 2) / 2;
		}
	}

	// This needs to be near the bottom of this file.
	globals.currentRunRep.on('change', newVal => {
		const img = document.createElement('img');
		img.src = newVal.boxart.url;
		gBoxartImage = img;

		// If we're not currenly in the midst of a fade,
		// immediately load the new boxart into hiddenBoxart so its shows ASAP.
		if (currentBoxartScrollTl) {
			const currentTime = currentBoxartScrollTl.time();
			if (currentTime > BOXART_FADE_TIME && currentTime < currentBoxartScrollTl.duration() - BOXART_FADE_TIME + 0.1) {
				// This is confusing. You'd think it'd be hiddenBoxart that we change, but no.
				// This is because they're flipped immediately every time showBoxart() is called.
				recacheBoxartAfterImageLoad(showingBoxart);
			}
		}

		name.text = newVal.name.toUpperCase();

		if (newVal.releaseYear) {
			name.text += ` (${newVal.releaseYear})`;
		}

		name.text = name.text.replace('\\N', '\n');

		category.text = newVal.category;
		categoryRect.w = category.x + category.getBounds().width + 43;

		estimate.text = `EST: ${newVal.estimate}`;
		estimateRect.w = category.x + estimate.getBounds().width + 43;
		estimate.x = estimateRect.w - 34;
		estimateContainer.regX = estimateRect.w - 2;

		let imgEl = preloader.getResult('console-${newVal.console.toLowerCase()}');
		imgEl = imgEl || preloader.getResult('console-unknown');
		consoleBitmap.image = imgEl;

		// EaselJS has problems applying shadows to stroked graphics.
		// To work around this, we remove the shadow, cache the graphic, then apply the shadow to the cache.
		categoryBoxart.shadow = null;
		categoryBoxart.cache(0, 0, categoryRect.w, categoryRect.h);
		categoryBoxart.shadow = shadow;
		estimateBoxart.shadow = null;
		estimateBoxart.cache(0, 0, estimateRect.w, estimateRect.h);
		estimateBoxart.shadow = shadow;

		calcAndSetNameStyle();
		repositionConsole();
		recacheForeground();
	});

	return {
		disable() {
			stage.visible = false;
			stage.paused = true;
			stage.canvas.style.display = 'none';
		},

		enable() {
			stage.visible = true;
			stage.paused = false;
			stage.canvas.style.display = 'block';
		},

		/**
		 *  Sets the position and dimensions of the SpeedRun element.
		 *  Transitions to the new position and dimenstions with a hard cut, and restarts the boxart scroll anim.
		 *  @param {Number} x - The x position to set.
		 *  @param {Number} y - The y position to set.
		 *  @param {Number} w - The width to set.
		 *  @param {Number} h - The height to set.
		 *  @param {Object} opts - The options to set.
		 *  @param {Number} opts.nameY - How far from the top to place the name.
		 *  @param {Number} opts.nameMaxHeight - The maximum height of the name.
		 *  @param {Number} opts.categoryY - Hor far from the top to place the category.
		 *  @param {Number} [opts.scale=1] - The scale to draw all the individual elements at.
		 *  @param {Boolean} [opts.showEstimate] - Whether or not to show the run's estimate.
		 */
		configure(x, y, w, h, opts) {
			debug.log('[speedun] setSpeedRunDimensions(%s, %s, %s, %s)', x, y, w, h);

			this.enable();
			stageMaskRect.w = w;
			stageMaskRect.h = h;

			if (typeof opts.nameY === 'undefined') {
				throw new Error('opts.nameY must be defined');
			} else if (typeof opts.nameMaxHeight === 'undefined') {
				throw new Error('opts.nameMaxHeight must be defined');
			} else if (typeof opts.categoryY === 'undefined') {
				throw new Error('opts.categoryY must be defined');
			}

			gOpts = opts;
			opts.scale = opts.scale || 1;

			gWidth = w;
			gHeight = h;

			stage.canvas.style.left = `${x}px`;
			stage.canvas.style.top = `${y}px`;

			/* Okay, this is a new one.
			 * Enforcing a minimum canvas width of 330 and rounding the
			 * canvas height up to the nearest hundred seems to have a dramatic positive impact on performance.
			 */
			stage.canvas.width = Math.max(w, 330);
			stage.canvas.height = Math.max(Math.ceil(h / 100) * 100, 200);

			name.scaleX = name.scaleY = opts.scale;
			categoryContainer.scaleX = categoryContainer.scaleY = opts.scale;

			name.x = w - 10;

			categoryContainer.y = opts.categoryY;

			if (opts.showEstimate) {
				estimateContainer.visible = true;
				estimateContainer.x = gWidth;
				estimateContainer.y = categoryContainer.y + categoryRect.h + 14;
				estimate.x = estimateRect.w - 34;
			} else {
				estimateContainer.visible = false;
			}

			reformatBoxart();
			calcAndSetNameStyle();
			repositionConsole();
			recacheForeground();
		}
	};
});

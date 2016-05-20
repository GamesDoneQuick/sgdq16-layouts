'use strict';

const OMNIBAR_HEIGHT = 55;
const OMNIBAR_WIDTH_MINUS_LOGO = 1161;
const CTA_VERT_SLIDE_TIME = 0.6;
const WHITE = '#ffffff';
const GRAY = '#efefef';
const RED = '#d38585';
const GREEN = '#a7d385';
const numeral = require('numeral');
const Stage = require('../classes/stage');
const loader = require('../util/loader');
const globals = require('../util/globals');
const tabulate = require('../util/tabulate');

const stage = new Stage(1280, OMNIBAR_HEIGHT, 'omnibar');
stage.canvas.style.position = 'absolute';
stage.canvas.style.bottom = '0px';
stage.canvas.style.zIndex = '1';

const omnibar = new createjs.Container();
stage.addChild(omnibar);

const tl = new TimelineLite({autoRemoveChildren: true});
const state = {
	totalShowing: true,
	labelShowing: false
};
let lastShownGrandPrize;

/* ----- */

const gdqLogo = new createjs.Bitmap(loader.queue.getResult('omnibar-logo-gdq'));
const GDQ_LOGO_WIDTH = gdqLogo.getBounds().width;

const pcfLogo = new createjs.Bitmap(loader.queue.getResult('omnibar-logo-pcf'));
const PCF_LOGO_WIDTH = pcfLogo.getBounds().width;
pcfLogo.restingX = 1173;
pcfLogo.x = pcfLogo.restingX;
pcfLogo.y = -17;

/* ----- */

const barBg = new createjs.Shape();
barBg.graphics
	.beginFill('#0075a1')
	.drawRect(GDQ_LOGO_WIDTH, 0, OMNIBAR_WIDTH_MINUS_LOGO, OMNIBAR_HEIGHT);
barBg.cache(GDQ_LOGO_WIDTH, 0, OMNIBAR_WIDTH_MINUS_LOGO, OMNIBAR_HEIGHT);

/* ----- */

const CTA_CENTER_X = PCF_LOGO_WIDTH / 2 + 12;
const CTA_TEXT_MASK_WIDTH = OMNIBAR_WIDTH_MINUS_LOGO / 2;

const cta = new createjs.Container();
cta.x = GDQ_LOGO_WIDTH + OMNIBAR_WIDTH_MINUS_LOGO / 2 - CTA_CENTER_X;
cta.y = 10;

const ctaLeftTextMask = new createjs.Shape();
ctaLeftTextMask.graphics.drawRect(CTA_CENTER_X - CTA_TEXT_MASK_WIDTH, -cta.y, CTA_TEXT_MASK_WIDTH, OMNIBAR_HEIGHT);

const ctaLeftText = new createjs.Text('', '800 32px proxima-nova', 'white');
ctaLeftText.textAlign = 'right';
ctaLeftText.restingX = 0;
ctaLeftText.hiddenX = 383 + CTA_CENTER_X;
ctaLeftText.x = ctaLeftText.hiddenX;
ctaLeftText.mask = ctaLeftTextMask;
ctaLeftText.snapToPixel = false;

const ctaRightTextMask = new createjs.Shape();
ctaRightTextMask.graphics.drawRect(CTA_CENTER_X, -cta.y, CTA_TEXT_MASK_WIDTH, OMNIBAR_HEIGHT);

const ctaRightText = new createjs.Text('', '800 32px proxima-nova', 'white');
ctaRightText.restingX = PCF_LOGO_WIDTH + 24;
ctaRightText.hiddenX = -297 - CTA_CENTER_X;
ctaRightText.x = ctaRightText.hiddenX;
ctaRightText.mask = ctaRightTextMask;
ctaRightText.snapToPixel = false;

pcfLogo.ctaX = cta.x + 12;

cta.addChild(ctaLeftTextMask, ctaRightTextMask, ctaLeftText, ctaRightText);

/* ----- */

const label = new createjs.Container();

const labelBg = new createjs.Shape();
labelBg.skewX = -10;
labelBg.x = -10;

const labelBgLayer3 = labelBg.graphics.beginFill('#034a65').drawRect(0, 0, 0, OMNIBAR_HEIGHT).command;
const labelBgLayer2 = labelBg.graphics.beginFill('#0075a1').drawRect(-5, 0, 0, OMNIBAR_HEIGHT).command;
const labelBgLayer1 = labelBg.graphics.beginFill('#034a65').drawRect(-10, 0, 0, OMNIBAR_HEIGHT).command;
const labelBgLayers = [labelBgLayer3, labelBgLayer2, labelBgLayer1];

const labelText = new createjs.Text();
labelText.color = 'white';
labelText.textAlign = 'center';
labelText.x = 82;
labelText.y = 22;
labelText.mask = labelBg;

label.addChild(labelBg, labelText);

/**
 * Immediately sets the text and font size of the label.
 * @param {String} text - The new text to display.
 * @param {Number} size - The new font size to set.
 * @returns {undefined}
 */
function setLabelText(text, size) {
	labelText.font = `800 ${size}px proxima-nova`;
	labelText.lineHeight = size - size * 0.2;
	labelText.text = text;
	labelText.regY = labelText.getBounds().height / 2;
}

/**
 * Creates an animation timeline for showing the label.
 * @param {String} text - The text to show.
 * @param {Number} size - The font size to use.
 * @returns {TimelineLite} - An animation timeline.
 */
function showLabel(text, size) {
	const tmpTL = new TimelineLite();

	if (state.labelShowing) {
		tmpTL.to(labelText, 0.25, {
			alpha: 0,
			ease: Power1.easeInOut,
			onComplete: setLabelText,
			onCompleteParams: [text, size]
		});

		tmpTL.to(labelText, 0.25, {
			alpha: 1,
			ease: Power1.easeInOut
		});
	} else {
		tmpTL.staggerTo(labelBgLayers, 1.2, {
			onStart() {
				state.labelShowing = true;
				setLabelText(text, size);
			},
			w: 180,
			ease: Elastic.easeOut.config(0.5, 0.5)
		}, 0.08);
	}

	return tmpTL;
}

/**
 * Creates an animation timeline for hiding the label.
 * @returns {TimelineLite} - An animation timeline.
 */
function hideLabel() {
	const tmpTL = new TimelineLite();

	if (state.labelShowing) {
		const reverseLabelBgLayers = labelBgLayers.slice(0).reverse();
		tmpTL.staggerTo(reverseLabelBgLayers, 0.7, {
			onStart() {
				state.labelShowing = false;
			},
			w: 0,
			ease: Back.easeIn.config(1.3)
		}, 0.08);
	}

	return tmpTL;
}

/* ----- */

const mainLine1 = new createjs.Text('', '800 18px proxima-nova', 'white');
mainLine1.restingX = 186;
mainLine1.restingY = 2;
mainLine1.x = mainLine1.restingX;
mainLine1.y = mainLine1.restingY;

const mainLine2 = new createjs.Text('', '800 33px proxima-nova', 'white');
mainLine2.restingX = 190;
mainLine2.restingY = 18;
mainLine2.x = 190;
mainLine2.y = 18;

const _latestMainLine1 = {};

/**
 * Creates an animation timeline for showing mainLine1.
 * @param {String} text - The text to show.
 * @param {String} [color="#ffffff"] - A hex color string (ex: "#ffffff').
 * @returns {TimelineLite} - An animation timeline.
 */
function showMainLine1(text, color = WHITE) {
	if (text === _latestMainLine1.text && color === _latestMainLine1.color) {
		return;
	}

	_latestMainLine1.text = text;
	_latestMainLine1.color = color;

	const tmpTL = new TimelineLite();

	if (mainLine1.text) {
		tmpTL.to(mainLine1, 0.5, {
			y: -20,
			ease: Power2.easeIn
		});

		// Delay for a sec
		tmpTL.to({}, 0.25, {});
	}

	tmpTL.call(() => {
		mainLine1.text = text;

		if (text) {
			mainLine1.x = mainLine1.restingX - mainLine1.getBounds().width - 20;
			mainLine1.y = mainLine1.restingY;
			mainLine1.color = color;
		}
	}, null, null, '+=0.01');

	if (text) {
		tmpTL.to(mainLine1, 1.2, {
			x: mainLine1.restingX,
			ease: Power2.easeOut
		});
	}

	return tmpTL;
}

const _latestMainLine2 = {};

/**
 * Creates an animation timeline for showing mainLine2.
 * @param {String} text - The text to show.
 * @param {String} [color="#ffffff"] - A hex color string (ex: "#ffffff').
 * @returns {TimelineLite} - An animation timeline.
 */
function showMainLine2(text, color = WHITE) {
	color = color || WHITE;

	if (text === _latestMainLine2.text && color === _latestMainLine2.color) {
		return;
	}

	_latestMainLine2.text = text;
	_latestMainLine2.color = color;

	const tmpTL = new TimelineLite();

	if (mainLine2.text) {
		tmpTL.to(mainLine2, 0.5, {
			y: 50,
			ease: Power2.easeIn
		});

		// Delay for a sec
		tmpTL.to({}, 0.25, {});
	}

	tmpTL.call(() => {
		mainLine2.text = text;

		if (text) {
			mainLine2.x = mainLine2.restingX - mainLine2.getBounds().width - 20;
			mainLine2.y = mainLine2.restingY;
			mainLine2.color = color;
		}
	}, null, null, '+=0.01');

	if (text) {
		tmpTL.to(mainLine2, 1.2, {
			x: mainLine2.restingX,
			ease: Power2.easeOut
		});
	}

	return tmpTL;
}

/* ----- */

const totalContainer = new createjs.Container();

const totalLeftBorder = new createjs.Shape();
totalLeftBorder.graphics.beginFill('white').drawRect(0, 0, 3, OMNIBAR_HEIGHT);

const totalText = new createjs.Text('', '800 30px proxima-nova', 'white');
totalText.rawValue = 0;
totalText.x = 13;
totalText.y = 10;

totalContainer.addChild(totalLeftBorder, totalText);

globals.totalRep.on('change', newVal => {
	const TIME_PER_DOLLAR = 0.03;
	const delta = newVal.raw - totalText.rawValue;
	const duration = Math.min(delta * TIME_PER_DOLLAR, 5);
	TweenLite.to(totalText, duration, {
		rawValue: newVal.raw,
		ease: Power2.easeOut,
		onUpdate() {
			const formattedTotal = numeral(totalText.rawValue).format('$0,0');
			totalText.text = tabulate(formattedTotal);

			const totalContainerWidth = totalContainer.getBounds().width;
			totalContainer.showingX = OMNIBAR_WIDTH_MINUS_LOGO - totalContainerWidth - PCF_LOGO_WIDTH - 36;
			totalContainer.hiddenX = totalContainer.showingX + OMNIBAR_WIDTH_MINUS_LOGO - totalContainer.showingX;

			totalContainer.x = state.totalShowing ? totalContainer.showingX : totalContainer.hiddenX;

			mainLine1.maxWidth = totalContainer.showingX - mainLine1.restingX - 12;
			mainLine2.maxWidth = mainLine1.maxWidth - 4;
		}
	});
});

/**
 * Creates an animation timeline for showing the fundraising total.
 * @returns {TimelineLite} - An animation timeline.
 */
function showTotal() {
	const tmpTL = new TimelineLite();

	if (!state.totalShowing) {
		tmpTL.call(() => {
			TweenLite.to(totalContainer, 0.7, {
				onStart() {
					state.totalShowing = true;
				},
				x: totalContainer.showingX,
				ease: Power2.easeOut
			});
		}, null, null, '+=0.01');

		tmpTL.to({}, 0.7, {});
	}

	return tmpTL;
}

/**
 * Creates an animation timeline for hiding the fundraising total.
 * @returns {TimelineLite} - An animation timeline.
 */
function hideTotal() {
	const tmpTL = new TimelineLite();

	if (state.totalShowing) {
		tmpTL.call(() => {
			TweenLite.to(totalContainer, 0.7, {
				onStart() {
					state.totalShowing = false;
				},
				x: totalContainer.hiddenX,
				ease: Power2.easeIn
			});
		}, null, null, '+=0.01');

		tmpTL.to({}, 0.7, {});
	}

	return tmpTL;
}

/* ----- */

// This is what holds the "Up Next", "Bid War", and "Raffle Prizes" modes.
const mainContainer = new createjs.Container();
mainContainer.x = GDQ_LOGO_WIDTH;
mainContainer.addChild(mainLine1, mainLine2, labelBg, labelText, totalContainer);

omnibar.addChild(barBg, mainContainer, cta, gdqLogo, pcfLogo);

/* ----- */

/**
 * Adds an animation to the global timeline for showing the call-to-action.
 * @param {Boolean} immediate - If true, clears all pending animations and shows the CTA immediately.
 * @returns {undefined}
 */
function showCTA(immediate) {
	if (immediate) {
		tl.clear();
	}

	tl.call(() => {
		hideLabel();
		hideTotal();
	}, null, null, '+=0.01');

	// Move PCF logo to center
	tl.to(pcfLogo, 1.2, {
		onStart() {
			ctaLeftText.text = '#AGDQ2016 benefits the';
			ctaRightText.text = 'Prevent Cancer Foundation';
		},
		x: pcfLogo.ctaX,
		ease: Power3.easeInOut
	});

	// Enter Line 1
	tl
		.add('showCTA_Line1Enter')
		.to(ctaLeftText, CTA_VERT_SLIDE_TIME, {
			x: ctaLeftText.restingX,
			ease: Power2.easeOut
		}, 'showCTA_Line1Enter')
		.to(ctaRightText, CTA_VERT_SLIDE_TIME, {
			x: ctaRightText.restingX,
			ease: Power2.easeOut
		}, 'showCTA_Line1Enter');

	// Exit Line 1
	tl
		.add('showCTA_Line1Exit', `+=${globals.displayDuration}`)
		.to(ctaLeftText, CTA_VERT_SLIDE_TIME, {
			y: -40,
			ease: Power2.easeIn
		}, 'showCTA_Line1Exit')
		.to(ctaRightText, CTA_VERT_SLIDE_TIME, {
			y: 38,
			ease: Power2.easeIn,
			onComplete() {
				ctaLeftText.y = 38;
				ctaRightText.y = -40;
				ctaLeftText.text = 'Donate to PCF at';
				ctaRightText.text = 'gamesdonequick.com';
			}
		}, 'showCTA_Line1Exit');

	// Enter Line 2
	tl
		.add('showCTA_Line2Enter')
		.to(ctaLeftText, CTA_VERT_SLIDE_TIME, {
			y: 0,
			ease: Power2.easeOut
		}, 'showCTA_Line2Enter')
		.to(ctaRightText, CTA_VERT_SLIDE_TIME, {
			y: 0,
			ease: Power2.easeOut
		}, 'showCTA_Line2Enter');

	// Exit Line 2
	tl
		.add('showCTA_Line2Exit', `+=${globals.displayDuration}`)
		.to(ctaLeftText, CTA_VERT_SLIDE_TIME, {
			x: ctaLeftText.hiddenX,
			ease: Power2.easeIn
		}, 'showCTA_Line2Exit')
		.to(ctaRightText, CTA_VERT_SLIDE_TIME, {
			x: ctaRightText.hiddenX,
			ease: Power2.easeIn
		}, 'showCTA_Line2Exit');

	tl.add('showCTA_end');

	// Move PCF Logo back to far right
	tl.to(pcfLogo, 1.2, {
		x: pcfLogo.restingX,
		ease: Power3.easeInOut
	}, 'showCTA_end');

	tl.call(() => {
		showTotal();
		showCurrentBids();
	}, null, null, 'showCTA_end+=0.3');
}

/**
 * Adds an animation to the global timeline for showing the next upcoming speedrun.
 * @param {Boolean} immediate - If true, clears all pending animations and shows the next run immediately.
 * @returns {undefined}
 */
function showUpNext(immediate) {
	let upNextRun = globals.nextRun;

	if (window.currentLayout === 'break' || window.currentLayout === 'interview') {
		upNextRun = globals.currentRun;
	}

	if (upNextRun) {
		if (immediate) {
			tl.clear();
		}

		tl.to({}, 0.3, {
			onStart() {
				showLabel('UP NEXT', 32);
			}
		});

		// GSAP is dumb with `call` sometimes. Putting this in a near-zero duration tween seems to be more reliable.
		tl.to({}, 0.01, {
			onComplete() {
				/* Depending on how we enter the very end of the schedule, we might end up in this func
				 * after window.nextRun has been set to null. In that case, we immediately clear the
				 * timeline and bail out to showing bids again.
				 */
				const upNextRun = window.currentLayout === 'break' ? globals.currentRun : globals.nextRun;
				if (upNextRun) {
					showMainLine1(upNextRun.concatenatedRunners);
					showMainLine2(`${upNextRun.name.replace('\\n', ' ').trim()} - ${upNextRun.category}`);
				} else {
					tl.clear();

					tl.to({}, 0.3, {
						onStart() {
							showMainLine1('');
							showMainLine2('');
						},
						onComplete: showCurrentBids
					});
				}
			}
		});

		// Give it some time to show
		tl.to({}, globals.displayDuration, {});
	}

	tl.to({}, 0.3, {
		onStart() {
			showMainLine1('');
			showMainLine2('');
		},
		onComplete: showCTA
	});
}

/**
 * Adds an animation to the global timeline for showing all current bids.
 * @param {Boolean} immediate - If true, clears all pending animations and shows bids immediately.
 * @returns {undefined}
 */
function showCurrentBids(immediate) {
	if (immediate) {
		tl.clear();
	}

	if (globals.currentBids.length > 0) {
		let showedLabel = false;

		// Figure out what bids to display in this batch
		const bidsToDisplay = [];

		globals.currentBids.forEach(bid => {
			// Don't show closed bids in the automatic rotation.
			if (bid.state.toLowerCase() === 'closed') {
				return;
			}

			// We have at least one bid to show, so show the label
			if (!showedLabel) {
				showedLabel = true;
				tl.to({}, 0.3, {
					onStart() {
						showLabel('DONATION\nINCENTIVES', 24);
					}
				});
			}

			// If we have already have our three bids determined, we still need to check
			// if any of the remaining bids are for the same speedrun as the third bid.
			// This ensures that we are never displaying a partial list of bids for a given speedrun.
			if (bidsToDisplay.length < 3) {
				bidsToDisplay.push(bid);
			} else if (bid.speedrun === bidsToDisplay[bidsToDisplay.length - 1].speedrun) {
				bidsToDisplay.push(bid);
			}
		});

		// Loop over each bid and queue it up on the timeline
		bidsToDisplay.forEach(showBid);
	}

	tl.to({}, 0.3, {
		onStart() {
			showMainLine1('');
			showMainLine2('');
		},
		onComplete: showCurrentPrizes
	});
}

/**
 * Adds an animation to the global timeline for showing a specific bid.
 * @param {Object} bid - The bid to display.
 * @param {Boolean} immediate - If true, clears all pending animations and shows the bid immediately.
 * @returns {undefined}
 */
function showBid(bid, immediate) {
	if (immediate) {
		tl.clear();
		tl.call(showLabel, ['BID WAR', 33]);
	}

	let mainLine1Text = bid.description;
	let mainLine1Color = WHITE;

	// If this bid is closed, we want the text to default to gray.
	if (bid.state.toLowerCase() === 'closed') {
		mainLine1Text += ' (CLOSED)';
		mainLine1Color = GRAY;
	}

	// GSAP is dumb with `call` sometimes. Putting this in a near-zero duration tween seems to be more reliable.
	tl.to({}, 0.01, {
		onComplete() {
			showMainLine1(mainLine1Text, mainLine1Color);
		}
	});

	// If this is a donation war, up to three options for it.
	// Else, it must be a normal incentive, so show its total amount raised and its goal.
	if (bid.options) {
		// If there are no options yet, display a message.
		if (bid.options.length === 0) {
			tl.call(showMainLine2, ['Be the first to bid!'], null);
		} else {
			bid.options.forEach((option, index) => {
				if (index > 2) {
					return;
				}

				tl.call(() => {
					// If this bid is closed, the first option (the winner)
					// should be green and the rest should be red.
					let mainLine2Color = WHITE;
					if (bid.state.toLowerCase() === 'closed') {
						if (index === 0) {
							mainLine2Color = GREEN;
						} else {
							mainLine2Color = RED;
						}
					}

					const mainLine2Text = `${index + 1}. ${option.description || option.name} - ${option.total}`;
					showMainLine2(mainLine2Text, mainLine2Color);
				}, null, null, `+=${0.08 + (index * 4)}`);
			});
		}
	} else {
		tl.call(() => {
			const mainLine2Color = bid.state.toLowerCase() === 'closed' ? GRAY : WHITE;
			showMainLine2(`${bid.total} / ${bid.goal}`, mainLine2Color);
		}, null, null, '+=0.08');
	}

	// Give the bid some time to show
	tl.to({}, globals.displayDuration, {});

	// If we're just showing this one bid on-demand, show "Prizes" next.
	if (immediate) {
		tl.to({}, 0.3, {
			onStart() {
				showMainLine1('');
				showMainLine2('');
			},
			onComplete: showCurrentPrizes
		});
	}
}

/**
 * Adds an animation to the global timeline for showing the current prizes
 * @param {Boolean} immediate - If true, clears all pending animations and shows prizes immediately.
 * @returns {undefined}
 */
function showCurrentPrizes(immediate) {
	if (immediate) {
		tl.clear();
	}

	if (globals.currentGrandPrizes.length > 0 || globals.currentNormalPrizes.length > 0) {
		const prizesToDisplay = globals.currentNormalPrizes.slice(0);
		tl.to({}, 0.3, {
			onStart() {
				showLabel('RAFFLE\nPRIZES', 30);
			}
		});

		if (globals.currentGrandPrizes.length) {
			// Figure out what grand prize to show in this batch.
			const lastShownGrandPrizeIdx = globals.currentGrandPrizes.indexOf(lastShownGrandPrize);
			const nextGrandPrizeIdx = lastShownGrandPrizeIdx >= globals.currentGrandPrizes.length - 1 ?
				0 : lastShownGrandPrizeIdx + 1;
			const nextGrandPrize = globals.currentGrandPrizes[nextGrandPrizeIdx];

			if (nextGrandPrize) {
				prizesToDisplay.unshift(nextGrandPrize);
				lastShownGrandPrize = nextGrandPrize;
			}
		}

		// Loop over each prize and queue it up on the timeline
		prizesToDisplay.forEach(showPrize);
	}

	tl.to({}, 0.3, {
		onStart() {
			showMainLine1('');
			showMainLine2('');
		},
		onComplete: showUpNext
	});
}

/**
 * Adds an animation to the global timeline for showing a specific prize.
 * @param {Object} prize - The prize to display.
 * @param {Boolean} immediate - If true, clears all pending animations and shows the prize immediately.
 * @returns {undefined}
 */
function showPrize(prize, immediate) {
	if (immediate) {
		tl.clear();
		tl.call(showLabel, ['RAFFLE\nPRIZES', 30], null, '+=0.01');
	}

	// GSAP is dumb with `call` sometimes. Putting this in a near-zero duration tween seems to be more reliable.
	tl.to({}, 0.01, {
		onComplete() {
			showMainLine1(`Provided by ${prize.provided}`);

			if (prize.grand) {
				showMainLine2(`Grand Prize: ${prize.description}`);
			} else {
				showMainLine2(prize.description);
			}
		}
	});

	// Give the prize some time to show
	tl.to({}, globals.displayDuration, {});

	// If we're just showing this one prize on-demand, show "Up Next" next.
	if (immediate) {
		tl.to({}, 0.3, {
			onStart() {
				showMainLine1('');
				showMainLine2('');
			},
			onComplete: showUpNext
		});
	}
}

nodecg.listenFor('barDemand', data => {
	switch (data.type) {
		case 'bid':
			showBid(data, true);
			break;
		case 'prize':
			showPrize(data, true);
			break;
		default:
			throw new Error(`Invalid barDemand type: ${data.type}`);
	}
});

nodecg.listenFor('barCurrentBids', () => {
	showCurrentBids(true);
});

nodecg.listenFor('barCurrentPrizes', () => {
	showCurrentPrizes(true);
});

nodecg.listenFor('barUpNext', () => {
	showUpNext(true);
});

nodecg.listenFor('barCTA', () => {
	showCTA(true);
});

// CTA is the first thing we show, so we use this to start our loop
showCTA();

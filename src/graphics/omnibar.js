'use strict';

const OMNIBAR_HEIGHT = 55;
const OMNIBAR_WIDTH_MINUS_LOGO = 1161;
const CTA_VERT_SLIDE_TIME = 0.6;
const WHITE = '#ffffff';
const GRAY = '#efefef';
const RED = '#d38585';
const GREEN = '#a7d385';
const numeral = require('numeral');
const GDQText = require('./classes/gdq-text');
const loader = require('./util/loader');
const globals = require('./util/globals');
const tabulate = require('./util/tabulate');

loader.load('omnibar', {gameplay: false}).then(() => {
	const CTA_CENTER_X = CHARITY_LOGO_WIDTH / 2 + 12;
	const CTA_TEXT_MASK_WIDTH = OMNIBAR_WIDTH_MINUS_LOGO / 2;

	const cta = new createjs.Container();
	cta.x = GDQ_LOGO_WIDTH + OMNIBAR_WIDTH_MINUS_LOGO / 2 - CTA_CENTER_X;
	cta.y = 10;

	const ctaLeftTextMask = new createjs.Shape();
	ctaLeftTextMask.graphics.drawRect(CTA_CENTER_X - CTA_TEXT_MASK_WIDTH, -cta.y, CTA_TEXT_MASK_WIDTH, OMNIBAR_HEIGHT);

	const ctaLeftText = new GDQText(800, '32px');
	ctaLeftText.textAlign = 'right';
	ctaLeftText.restingX = 0;
	ctaLeftText.hiddenX = 383 + CTA_CENTER_X;
	ctaLeftText.x = ctaLeftText.hiddenX;
	ctaLeftText.mask = ctaLeftTextMask;
	ctaLeftText.snapToPixel = false;

	const ctaRightTextMask = new createjs.Shape();
	ctaRightTextMask.graphics.drawRect(CTA_CENTER_X, -cta.y, CTA_TEXT_MASK_WIDTH, OMNIBAR_HEIGHT);

	const ctaRightText = new GDQText(800, '32px');
	ctaRightText.restingX = CHARITY_LOGO_WIDTH + 24;
	ctaRightText.hiddenX = -297 - CTA_CENTER_X;
	ctaRightText.x = ctaRightText.hiddenX;
	ctaRightText.mask = ctaRightTextMask;
	ctaRightText.snapToPixel = false;

	charityLogo.ctaX = cta.x + 12;

	cta.addChild(ctaLeftTextMask, ctaRightTextMask, ctaLeftText, ctaRightText);

	/* ----- */

	/**
	 * Adds an animation to the global timeline for showing all current bids.
	 * @param {Boolean} [immediate] - If true, clears all pending animations and shows bids immediately.
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
	 * @param {Boolean} [immediate] - If true, clears all pending animations and shows the bid immediately.
	 * @returns {undefined}
	 */
	function showBid(bid, immediate) {
		if (immediate) {
			tl.clear();
			tl.call(showLabel, ['BID WAR', 30]);
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
	 * @param {Boolean} [immediate] - If true, clears all pending animations and shows prizes immediately.
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
					showLabel('RAFFLE\nPRIZES', 24);
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
	 * @param {Boolean} [immediate] - If true, clears all pending animations and shows the prize immediately.
	 * @returns {undefined}
	 */
	function showPrize(prize, immediate) {
		if (immediate) {
			tl.clear();
			tl.call(showLabel, ['RAFFLE\nPRIZES', 24], null, '+=0.01');
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
});

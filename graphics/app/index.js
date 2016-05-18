/* global requirejs, TweenLite, Power1, Typekit */
(function () {
	'use strict';

	const layoutState = nodecg.Replicant('layoutState');

	// Hack to prevent other instances of the layout from breaking the layoutState.
	// They have a brief window in which to change it before singleInstance kicks them off.
	layoutState.on('declared', rep => {
		if (rep.value.page === 'closed') {
			layoutState.value.page = 'preloading';

			// Prevent NodeCG restarts from breaking the layoutState.
			layoutState.on('change', newVal => {
				if (newVal.page === 'closed') {
					layoutState.value.page = 'open';
				}
			});
		}
	});

	// Wait until Typekit fonts are loaded before setting up the graphic.
	try {
		Typekit.load({active: init});
	} catch (e) {
		console.error(e);
	}

	let preloaderDone = false;
	let replicantsDone = false;

	function init() {
		requirejs(['debug', 'preloader', 'globals', 'easel'], (debug, preloader, globals, createjs) => {
			preloader.on('complete', handlePreloadComplete);

			function handlePreloadComplete() {
				preloader.removeAllEventListeners('complete');
				preloaderDone = true;
				debug.log('preloading complete');
				checkReplicantsAndPreloader();
			}

			if (window.replicantsDeclared) {
				replicantsDone = true;
				debug.log('replicants declared');
				checkReplicantsAndPreloader();
			} else {
				document.addEventListener('replicantsDeclared', () => {
					replicantsDone = true;
					debug.log('replicants declared');
					checkReplicantsAndPreloader();
				});
			}

			createjs.Ticker.timingMode = createjs.Ticker.RAF;
		});
	}

	function checkReplicantsAndPreloader() {
		if (!preloaderDone || !replicantsDone) {
			return;
		}

		requirejs([
			'components/background',
			'components/speedrun',
			'components/omnibar',
			'layout',
			'obs',
			'advertisements'
		], (bg, speedrun, omnibar, layout) => {
			layout.changeTo('break');
			window.layout = layout;
			layoutState.value.page = 'open';

			// Fade up the body once everything is loaded
			TweenLite.to(document.body, 0.5, {
				delay: 0.2,
				opacity: 1,
				ease: Power1.easeInOut
			});
		});
	}
})();

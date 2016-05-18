/* global define */
define(() => {
	'use strict';

	const createjs = requirejs('easel');
	const containerEl = document.getElementById('container');

	function Stage(w, h, id) {
		// Create the canvas element that will become the render target.
		const stageEl = document.createElement('canvas');
		if (id) {
			stageEl.id = id;
		}
		stageEl.width = w;
		stageEl.height = h;
		stageEl.style.position = 'absolute';

		// Add the canvas to the DOM
		containerEl.appendChild(stageEl);

		// Create the stage on the target canvas, and create a ticker that will render at 60 fps.
		const stage = new createjs.Stage(stageEl);
		createjs.Ticker.addEventListener('tick', event => {
			if (Stage.globalPause || event.paused) {
				return;
			}

			stage.update();
		});

		return stage;
	}

	Stage.globalPause = false;

	return Stage;
});

'use strict';

const containerEl = document.getElementById('container');

/**
 * Creates a new EaselJS Stage on the given <canvas> element.
 * @param {Number} w - The width to set the <canvas> to.
 * @param {Number} h - The height to set the <canvas> to.
 * @param {String} [id] - The ID of the <canvas> element to use. A new <canvas> element will be created if not provided.
 * @returns {Object} - An EaselJS Stage instance.
 * @constructor
 */
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

module.exports = Stage;

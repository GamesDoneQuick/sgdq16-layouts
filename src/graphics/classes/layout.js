'use strict';

const loader = require('../util/loader');
const setBackground = require('../components/background');

/** Class representing a Layout. **/
class Layout {
	/**
	 * Create a Layout.
	 * @param {String} name - The name of the layout. Determines which background image to load.
	 * @param {Function} attachedCallback - The callback to invoke once the layout is loaded.
	 * @param {Object} [loadOpts] - Options to pass to the "load" function.
	 */
	constructor(name, attachedCallback, loadOpts) {
		window.currentLayout = name;
		this.name = name;

		loader.load(name, loadOpts).then(() => {
			setBackground(this.name);
			attachedCallback.call(this);
		});
	}
}

module.exports = Layout;

'use strict';

const app = require('express')();
const bodyParser = require('body-parser');

module.exports = function (nodecg) {
	app.use(bodyParser.text());
	app.post('/sgdq16-layouts/currentScene', (req, res) => {
		console.log('received currentScene POST:', req.body);
		res.sendStatus(200);
	});

	nodecg.mount(app);
};

/* eslint-disable quote-props */
'use strict';

module.exports = [{
	context: __dirname,
	entry: {
		lowerthird: './src/graphics/lowerthird.js',
		hold: './src/graphics/hold.js',
		gameplay: './src/graphics/gameplay.js',
		infopop: './src/graphics/infopop.js',
		'results-and-rosters': './src/graphics/results-and-rosters.js'
	},
	output: {
		filename: '[name].js',
		path: `${__dirname}/graphics/`
	},
	devtool: 'source-map'
}, {
	context: __dirname,
	entry: {
		rosters: './src/dashboard/rosters.js'
	},
	output: {
		filename: '[name].js',
		path: `${__dirname}/dashboard/`
	},
	devtool: 'source-map'
}];

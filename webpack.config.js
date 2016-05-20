/* eslint-disable quote-props */
'use strict';

module.exports = [{
	context: __dirname,
	entry: {
		'3ds': './src/graphics/3ds.js',
		'3x2_1': './src/graphics/3x2_1.js',
		'3x2_2': './src/graphics/3x2_2.js',
		'4x3_1': './src/graphics/4x3_1.js',
		'4x3_2': './src/graphics/4x3_2.js',
		'4x3_3': './src/graphics/4x3_3.js',
		'4x3_4': './src/graphics/4x3_4.js',
		'16x9_1': './src/graphics/16x9_1.js',
		'16x9_2': './src/graphics/16x9_2.js',
		'break': './src/graphics/break.js',
		'ds': './src/graphics/ds.js',
		'ds_portrait': './src/graphics/ds_portrait.js',
		'interview': './src/graphics/interview.js'
	},
	output: {
		filename: '[name].js',
		path: `${__dirname}/graphics/built/`
	},
	devtool: 'source-map'
}];

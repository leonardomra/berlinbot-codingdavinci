'use strict';
/*jshint esversion: 6 */
/* jshint node: true */
//var dotent = require('dotenv').config();

const Part = require('./custom_modules/part');
//const Story = require('./custom_modules/story');

if (process.env.IS_ENV_WORKING) {
	console.log('Hi there!!!');
}

var part = new Part();
part.initTelegram();
'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const Bug = require('./custom_modules/mydebugger');
const Part = require('./custom_modules/part');
//const Story = require('./custom_modules/story');

if (process.env.IS_ENV_WORKING) {
	Bug.msg('Hi there!!!');
}

var part = new Part();
part.initTelegram();
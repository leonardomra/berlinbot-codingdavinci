'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const Bug = require('./custom_modules/mydebugger');
const App = require('./custom_modules/app');

if (process.env.IS_ENV_WORKING) {
	Bug.msg('Hi there!!!');
}

var app = new App();
app.init();
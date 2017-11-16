'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const Bug = require('./custom_modules/mydebugger');
const App = require('./custom_modules/app');
const Telegram = require('telegram-node-bot');

const telegram = new Telegram.Telegram(process.env.TELEGRAM_TOKEN, {
		workers: 1, // coment on production
		webAdmin: {
		port: process.env.PORT || 5000
	}
});

if (!telegram._workers) {
	var app = new App();
	app.telegram = telegram;
	app.init();
}








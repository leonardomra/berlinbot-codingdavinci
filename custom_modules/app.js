'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const Bug = require('./mydebugger');
const Part = require('./part');
const Bot = require('./artfacts/story/Bot');

class App {

	init() {
		let self = this;
		self.bot = new Bot();
		self.bot.telegram = self.telegram;
		self.bot.wakeup();
	}

}

module.exports = App;
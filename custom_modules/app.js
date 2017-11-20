'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const Bug = require('./mydebugger');
const Bot = require('./artfacts/story/Bot');

class App {

	init() {
		let self = this;
		self.bot = new Bot();
		//self.bot.telegram = self.telegram;
		self.bot.telegraf = self.telegraf;
		self.bot.hook = self.hook;
		self.bot.port = self.port;
		setTimeout(function() {
			console.log('wake up ->>>');
			self.bot.wakeup();
		}, 3000);
	}

}

module.exports = App;
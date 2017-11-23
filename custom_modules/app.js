'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const bug = require('./mydebugger');
const Bot = require('./artfacts/story/Bot');

class App {

	init(projectsToLoad) {
		bug.msg('wake up ->>>');
		let self = this;
		self.bot = new Bot();
		self.bot.telegraf = self.telegraf;
		self.bot.hook = self.hook;
		self.bot.port = self.port;
		self.bot.wakeup(projectsToLoad);
	}
}

module.exports = App;
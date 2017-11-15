'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const Bug = require('./../../mydebugger');

class BotUser {

	init() {
		Bug.artmsg('Hit from BotUser!');
	}
}

module.exports = BotUser;
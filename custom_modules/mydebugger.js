/*jshint esversion: 6 */
/* jshint node: true */

const bug_msg = require('debug')('worker:msg');
const bug_error = require('debug')('worker:error');
const SupportsColor = require('supports-color');

module.exports = {
	check: function() {
		if (SupportsColor.stdout) {
			console.log('Terminal stdout supports color');
		}
		if (SupportsColor.stdout.has256) {
			console.log('Terminal stdout supports 256 colors');
		}
		if (SupportsColor.stderr.has16m) {
			console.log('Terminal stderr supports 16 million colors (truecolor)');
		}
	},
	msg: function(obj) {
		//this.check();
		return bug_msg(obj);
	},
	error: function(obj) {
		//this.check();
		return bug_error(obj);
	}
};
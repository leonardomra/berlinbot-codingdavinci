'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

var Node = require('./../node');

class Event extends Node {

	loadEventWithID(id, callback) {
		let self = this;
		self.date = undefined;
		self.instance = undefined;
		self.kb = undefined;
		self.isEventLoaded = false;
		self.getEvent(id, function(response) {
			this.date = response.date;
			this.instantiation = response.instantiation;
			this.kb = response.kb;
			this.isEventLoaded = true;
			callback(this);
		}.bind(self));
	}

	loadEventWithReadyInfo(date, instance, kb){
		let self = this;
		self.date = date;
		self.instance = instance;
		self.kb = kb;
		self.isEventLoaded = true;
	}
}

module.exports = Event;
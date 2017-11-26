'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

var Node = require('./../node');

class Location extends Node {

	init() {
		super.init();
	}

	loadLocationWithID(id, callback) {
		let self = this;
		self.pos = undefined;
		self.extra = undefined;
		self.gps = undefined;
		self.instance = undefined;
		self.kb = undefined;
		this.isLocationLoaded = false;
		self.getLocation(id, function(response) {
			this.pos = response.pos;
			this.extra = response.extra;
			this.gps = response.gps;
			this.instance = response.instance;
			this.kb = response.kb;
			this.isLocationLoaded = true;
			callback(this);
		}.bind(self));
	}

	loadLocationWithReadyInfo(pos, extra, gps, instance, kb){
		let self = this;
		self.pos = pos;
		self.extra = extra;
		self.gps = gps;
		self.instance = instance;
		self.kb = kb;
		this.isLocationLoaded = true;
	}
}

module.exports = Location;
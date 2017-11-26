'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

var Node = require('./../node');

class Institution extends Node {

	init() {
		super.init();
	}

	loadInstitutionWithID(id, callback) {
		let self = this;
		self.name = undefined;
		self.instance = undefined;
		self.kb = undefined;
		this.isLocationLoaded = false;
		self.getLocation(id, function(response) {
			this.name = response.gps;
			this.instance = response.instance;
			this.kb = response.kb;
			this.isLocationLoaded = true;
			callback(this);
		}.bind(self));
	}

	loadInstitutionWithReadyInfo(name, instance, kb){
		let self = this;
		self.name = name;
		self.instance = instance;
		self.kb = kb;
		this.isLocationLoaded = true;
	}
}

module.exports = Institution;
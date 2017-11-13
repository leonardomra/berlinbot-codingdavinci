'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

var Node = require('./node');

class Quantifier extends Node {

	setSubject(_subject) {
		let self = this;
		self.subject = _subject;
	}

	setEntity(_entity) {
		let self = this;
		self.entity = _entity;
	}

	loadQuantifierWithID(_quantifierId, callback) {
		let self = this;
		self.quantifierId = _quantifierId;
		self.type = undefined;
		self.value = undefined;
		self.instruction = undefined;
		self.isTypeLoaded = false;
		self.isValueLoaded = false;
		self.isQuantifierLoaded = false;
		self.getQuantifier(self.quantifierId, function(response) {
			self.type = response.type;
			self.value = response.value;
			self.instruction = response.instruction;
			self.isTypeLoaded = true;
			self.isValueLoaded = true;
			if (this.watchQuantifierLoad()) callback(true);
		}.bind(self));

	}

	watchQuantifierLoad() {
		let self = this;
		if (self.isTypeLoaded === true && self.isValueLoaded === true) {
			self.isQuantifierLoaded = true;
			//console.log(':loading status: quantifier loaded!');
		}
		if (self.isQuantifierLoaded === true) {
			return true;
		} else {
			return false;
		}
	}
}

module.exports = Quantifier;
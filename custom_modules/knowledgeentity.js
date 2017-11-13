'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

var Node = require('./node');
var Quantifier = require('./quantifier');

class Entity extends Node {

	setSubject(_subject){
		let self = this;
		self.subject = _subject;
	}

	loadEntityWithID(_entityId, callback) {
		let self = this;
		self.entityId = _entityId;
		self.quantifiers = [];
		self.isUnfit = false;
		self.isBasicEntityLoaded = false;
		self.isCompleteEntityLoaded = false;
		self.isKindLoaded = false;
		self.isLabelLoaded = false;
		self.isKindLoaded = false;
		self.areAllQuantifiersLoaded = false;
		self.getEntity(self.entityId, function(response) {
			this.isSubject = response.is_subject;
			this.kind = response.kind;
			this.label = response.label;
			this.isLabelLoaded = true;
			this.isKindLoaded = true;
			if (this.watchEntityLoad()) callback(this);
		}.bind(self));
		this.getEntityQuantifiers(this.entityId, function(response) {
			if (response.length === 0) this.isUnfit = true;
			this.loadQuantifiers(response, callback);
		}.bind(this));
	}

	loadQuantifiers(_quantifiers, callback) {
		let self = this;
		self.callback = callback;
		_quantifiers.forEach(function(quantifier) {
			var qt = new Quantifier();
			qt.setSubject(self.subject);
			qt.setEntity(self);
			qt.loadQuantifierWithID(quantifier.quantifier_id, function(response) {
				if (this.watchQuantifiersLoad()) {
					this.areAllQuantifiersLoaded = true;
					if (this.watchEntityLoad()) this.callback(this);
				}
			}.bind(self));
			self.quantifiers.push(qt);
		});
	}

	watchEntityLoad() {
		let self = this;
		if (self.isLabelLoaded === true && self.isKindLoaded === true) {
			self.isBasicEntityLoaded = true;
			//console.log(':loading status: basic entity loaded!');
		}
		if (self.isBasicEntityLoaded === true && self.areAllQuantifiersLoaded === true) {
			self.isCompleteEntityLoaded = true;
			//console.log(':loading status: complete entity loaded!');
		}
		if (self.isBasicEntityLoaded === true && self.isCompleteEntityLoaded === true) {
			return true;
		} else {
			return false;
		}
	}

	watchQuantifiersLoad() {
		let self = this;
		for (var i = 0; i < self.quantifiers.length; i++) {
			if (self.quantifiers[i].isQuantifierLoaded === false || self.quantifiers[i].isQuantifierLoaded === undefined) {
				return false;
			}
		}
		return true;
	}
}

module.exports = Entity;
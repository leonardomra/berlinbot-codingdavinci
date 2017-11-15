'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const Node = require('./node');
const Entity = require('./knowledgeentity');
const bug = require('./../mydebugger');

class Subject extends Node {

	init() {
		super.init();
		let self = this;
		self.chunkId = undefined;
		self.label = undefined;
		self.kind = undefined;
		self.content= undefined;
		self.rawContent = undefined;
		self.knowledgeEntities = [];
		self.aggregates = [];
		self.isBasicSubjectLoaded = false;
		self.isCompleteSubjectLoaded = false;
		self.isLabelLoaded = false;
		self.isContentLoaded = false;
		self.isRawContentLoaded = false;
		self.isKindLoaded = false;
		self.areAllEntitiesLoaded = false;
	}

	getInformationAboutSubject() {
		let self = this;
		console.log('label: ' + self.label + '\n' + 'kind: ' + self.kind + '\n' + 'content: ' + self.content + '\n' + 'entities: ' + self.knowledgeEntities);
	}

	loadSubjectWithID(_chunkId, callback) {
		let self = this;
		self.chunkId = _chunkId;
		self.getSubject(self.chunkId, function(response) {
			this.label = response.label;
			this.content = response.content;
			this.rawContent = response.rawContent;
			this.isLabelLoaded = true;
			this.isContentLoaded = true;
			this.isRawContentLoaded = true;
			if (this.watchSubjectLoad()) callback(this);
		}.bind(self));
		self.getSubjectKind(self.chunkId, function(response) {
			this.kind = response;
			self.isKindLoaded = true;
			if (this.watchSubjectLoad()) callback(this);
		}.bind(self));
		self.getSubjectEntities(self.chunkId, function(response) { // no subject entity is added
			this.loadPredicates(response, callback);
		}.bind(self));
	}

	loadPredicates(_entities, callback) {
		let self = this;
		self.callback = callback;
		if (_entities.length === 0) {
			self.areAllEntitiesLoaded = true;
			if (self.isBasicSubjectLoaded) {
				self.isCompleteSubjectLoaded = true;
				self.callback(self);
			}
			return;
		}
		_entities.forEach(function(entity) {
			var en = new Entity();
			en.init();
			en.setSubject = self;
			en.loadEntityWithID(entity.entity_id, function(response) {
				if (this.watchEntitiesLoad()) {
					this.areAllEntitiesLoaded = true;
					if (this.watchSubjectLoad()) this.callback(this);
				}
			}.bind(self));
			self.knowledgeEntities.push(en);
		});
	}

	watchSubjectLoad() {
		let self = this;
		if (self.isLabelLoaded === true && self.isContentLoaded === true && self.isRawContentLoaded === true) {
			self.isBasicSubjectLoaded = true;
			//console.log(':loading status: basic subject loaded!');
		}
		if (self.isBasicSubjectLoaded === true && self.areAllEntitiesLoaded === true) {
			self.isCompleteSubjectLoaded = true;
			//console.log(':loading status: complete subject loaded!');
		}
		if (self.isBasicSubjectLoaded === true && self.isCompleteSubjectLoaded === true) {
			//bug.artmsg('Subject is loaded!');
			return true;
		} else {
			return false;
		}
	}

	watchEntitiesLoad() {
		let self = this;
		var filteredEntities = self.knowledgeEntities.filter(function(entity) {
			return entity.isUnfit === false;
		});
		for (var i = 0; i < filteredEntities.length; i++) {
			if (filteredEntities[i].isCompleteEntityLoaded === false || filteredEntities[i].isCompleteEntityLoaded === undefined) {
				return false;
			}
		}
		return true;
	}
}

module.exports = Subject;
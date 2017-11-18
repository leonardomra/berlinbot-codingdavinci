'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const bug = require('./../../mydebugger');
const KnowledgeChunk = require('./../knowledgechunk');

class StoryAct extends KnowledgeChunk {

	init() {
		super.init();
		let self = this;
		self.factIsLoaded = false;
		self.mainNarratives = [];
		self.mainNarrativesAreLoaded = false;
		self.pOIs = []; // strange formatting should be kept, computer is stupid
		self.pOIsAreLoaded = false; // strange formatting should be kept, computer is stupid
		self.actorSpeechs = []; // grammar mistake should be kept, computer is stupid
		self.actorSpeechsAreLoaded = false; // grammar mistake should be kept, computer is stupid

	}

	loadActWithObject(object) {
		let self = this;
		self.chunkId = object.chunkId;
		self.label = object.label;
		self.kind = object.kind;
		self.content= object.content;
		self.rawContent = object.rawContent;
		self.knowledgeEntities = object.knowledgeEntities;
		self.aggregates = object.aggregates;
		self.isBasicSubjectLoaded = object.isBasicSubjectLoaded;
		self.isCompleteSubjectLoaded = object.isCompleteSubjectLoaded;
		self.isLabelLoaded = object.isLabelLoaded;
		self.isContentLoaded = object.isContentLoaded;
		self.isRawContentLoaded = object.isRawContentLoaded;
		self.isKindLoaded = object.isKindLoaded;
		self.areAllEntitiesLoaded = object.areAllEntitiesLoaded;
		self.instantiation = object.instantiation;
		self.time = object.time;
		if (object.time !== undefined) {
			var time = object.time.split(':');
			self.encodedTime = new Date().setHours(time[0],time[1],0);
		}
	}

	/*
	encodeTime() {
		let self = this;
		if (self.time !== undefined) {
			var time = self.time.split(':');
			self.encodedTime = new Date().setHours(time[0],time[1],0);
		}
	}
	*/
}

module.exports = StoryAct;
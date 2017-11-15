'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const Bug = require('./../../mydebugger');
const KnowledgeChunk = require('./../knowledgechunk');

class StoryAct extends KnowledgeChunk {

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
	}
}

module.exports = StoryAct;
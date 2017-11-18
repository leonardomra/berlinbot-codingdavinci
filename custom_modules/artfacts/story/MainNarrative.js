'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const bug = require('./../../mydebugger');
const KnowledgeChunk = require('./../knowledgechunk');

class MainNarrative extends KnowledgeChunk {

	init() {
		super.init();
		let self = this;
		self.factIsLoaded = false;
		self.mediums = []; // grammar mistake should be kept, computer is stupid
		self.mediumsAreLoaded = false; // grammar mistake should be kept, computer is stupid
		self.actions = [];
		self.actionsAreLoaded = false;
	}

}

module.exports = MainNarrative;